import { randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { NextFunction, Request, Response } from "express";
import { db, householdMembersTable, householdsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { expandBrazilPhoneVariants, normalizeBrazilPhone, normalizePhoneDigits } from "./phone";

export type SessionRole = "user" | "owner" | "admin";

export type SessionData = {
  token: string;
  role: SessionRole;
  userId: number | null;
  householdId: number | null;
  memberId: number | null;
  name: string;
  email: string | null;
  billingStatus?: string;
  expiresAt: number;
};

type SessionRequest = Request & {
  session?: SessionData | null;
};

const SESSION_COOKIE = "contai_session";
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;
const SESSION_STORE_FILE = path.resolve(process.cwd(), ".data", "sessions.json");
const sessions = new Map<string, SessionData>();
const passwordResetTokens = new Map<
  string,
  {
    userId: number;
    expiresAt: number;
  }
>();

function ensureSessionStoreDir() {
  const dir = path.dirname(SESSION_STORE_FILE);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function persistSessions() {
  ensureSessionStoreDir();
  const activeSessions = [...sessions.values()].filter((session) => session.expiresAt > Date.now());
  writeFileSync(SESSION_STORE_FILE, JSON.stringify(activeSessions, null, 2), "utf-8");
}

function loadPersistedSessions() {
  try {
    if (!existsSync(SESSION_STORE_FILE)) {
      return;
    }

    const raw = readFileSync(SESSION_STORE_FILE, "utf-8");
    const parsed = JSON.parse(raw) as SessionData[];
    for (const session of parsed) {
      if (session?.token && session.expiresAt > Date.now()) {
        sessions.set(session.token, session);
      }
    }
  } catch {
    // ignore invalid persisted sessions
  }
}

function buildSessionExpiry(role?: SessionRole) {
  const age = role === "admin" ? 1000 * 60 * 30 : SESSION_MAX_AGE_MS;
  return Date.now() + age;
}

function storeSession(session: SessionData) {
  sessions.set(session.token, session);
  persistSessions();
  return session;
}

loadPersistedSessions();

function normalizeIdentifier(value: string) {
  return value.trim().toLowerCase();
}

function normalizePhone(value: string) {
  return normalizeBrazilPhone(value);
}

export function getAppBaseUrl() {
  return process.env.APP_BASE_URL?.trim() ?? "http://localhost:5173";
}

export function hashPassword(password: string) {
  return scryptSync(password, "contai-auth-salt", 64).toString("hex");
}

export function verifyPassword(password: string, passwordHash?: string | null) {
  if (!passwordHash) {
    return false;
  }

  const expected = Buffer.from(passwordHash, "hex");
  const received = scryptSync(password, "contai-auth-salt", 64);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

async function getIdentityByUserId(userId: number) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  if (!user) {
    return null;
  }

  if (user.role === "admin") {
    return { user, member: null, household: null };
  }

  if (!user.householdId) {
    return null;
  }

  const [member] = await db
    .select()
    .from(householdMembersTable)
    .where(eq(householdMembersTable.userId, user.id))
    .limit(1);
  const [household] = await db
    .select()
    .from(householdsTable)
    .where(eq(householdsTable.id, user.householdId))
    .limit(1);

  if (!household) {
    return null;
  }

  return { user, member, household };
}

function buildSessionFromIdentity(identity: NonNullable<Awaited<ReturnType<typeof getIdentityByUserId>>>) {
  const token = randomUUID();
  const masterEmail = process.env.MASTER_ADMIN_EMAIL?.trim().toLowerCase();
  const isAdmin =
    identity.user.role === "admin" || (masterEmail && identity.user.email?.toLowerCase().trim() === masterEmail);
  const role: SessionRole = isAdmin ? "admin" : (identity.member?.memberType === "owner" ? "owner" : "user");

    // Recuperação tripla de status para evitar falhas de mapeamento Drizzle
    const rawUserStatus = (identity.user.billingStatus || (identity.user as any).billing_status || "").toString().toLowerCase().trim();
    const rawHouseholdStatus = (identity.household?.billingStatus || (identity.household as any)?.billing_status || "").toString().toLowerCase().trim();
    
    const isActive = rawUserStatus.includes("active") || 
                     rawUserStatus.includes("ativ") || 
                     rawHouseholdStatus.includes("active") || 
                     rawHouseholdStatus.includes("ativ");

    const mergedStatus = isActive ? "active" : (rawUserStatus || rawHouseholdStatus || "pending");

    const session: SessionData = {
      token,
      role,
      userId: identity.user.id,
      householdId: identity.household?.id ?? null,
      memberId: identity.member?.id ?? null,
      name: identity.member?.displayName ?? identity.user.name,
      email: identity.user.email ?? null,
      billingStatus: mergedStatus,
      expiresAt: buildSessionExpiry(role),
    };

  return storeSession(session);
}

export async function createSessionForUserId(userId: number) {
  const identity = await getIdentityByUserId(userId);
  if (!identity) {
    return null;
  }
  return buildSessionFromIdentity(identity);
}

async function getDemoIdentity() {
  const users = await db.select().from(usersTable).orderBy(usersTable.id);
  const user =
    users.find((item) => item.role === "owner" && item.householdId != null) ??
    users.find((item) => item.role !== "admin" && item.householdId != null) ??
    users[0];

  if (!user) {
    throw new Error("Nenhum usuario demo foi encontrado para criar a sessao.");
  }

  const [member] = await db
    .select()
    .from(householdMembersTable)
    .where(eq(householdMembersTable.userId, user.id))
    .limit(1);
  const [household] = await db
    .select()
    .from(householdsTable)
    .where(eq(householdsTable.id, user.householdId!))
    .limit(1);

  return { user, member, household };
}

export async function createDemoSession(role: SessionRole) {
  if (role === "admin") {
    const token = randomUUID();
    const session: SessionData = {
      token,
      role: "admin",
      userId: null,
      householdId: null,
      memberId: null,
      name: "Admin Contai",
      email: "admin@contai.app",
      expiresAt: buildSessionExpiry(),
    };

    return storeSession(session);
  }

  // Demo sessions disabled for production safety
  return null;
}

export async function createCredentialSession(identifier: string, password: string) {
  const user = await findUserByIdentifier(identifier);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return null;
  }

  return createSessionForUserId(user.id);
}

export async function findUserByIdentifier(identifier: string) {
  const normalizedIdentifier = normalizeIdentifier(identifier);
  const normalizedPhone = normalizePhone(identifier);
  const phoneVariants = expandBrazilPhoneVariants(identifier);
  const users = await db.select().from(usersTable);

  return (
    users.find((item) => item.email?.trim().toLowerCase() === normalizedIdentifier) ??
    users.find((item) => {
      const stored = normalizePhone(item.phone);
      return stored === normalizedPhone || phoneVariants.includes(normalizePhoneDigits(item.phone));
    }) ??
    null
  );
}

export async function createPasswordResetRequest(identifier: string) {
  const user = await findUserByIdentifier(identifier);
  if (!user) {
    return {
      ok: true,
      message: "Se encontrarmos sua conta, vamos preparar a redefinicao de senha.",
      resetUrl: null as string | null,
      userId: null as number | null,
      email: null as string | null,
      name: null as string | null,
    };
  }

  const token = randomUUID();
  passwordResetTokens.set(token, {
    userId: user.id,
    expiresAt: Date.now() + 1000 * 60 * 30,
  });

  return {
    ok: true,
    message: "Pedido recebido. Se o e-mail estiver ativo, enviaremos o link de redefinicao agora.",
    resetUrl: `${getAppBaseUrl()}/redefinir-senha?token=${token}`,
    userId: user.id,
    email: user.email ?? null,
    name: user.name,
  };
}

export async function resetPasswordWithToken(token: string, password: string) {
  const payload = passwordResetTokens.get(token);

  if (!payload || payload.expiresAt < Date.now()) {
    passwordResetTokens.delete(token);
    return {
      ok: false,
      message: "Esse link de redefinicao expirou ou não e mais valido.",
      userId: null as number | null,
    };
  }

  await db
    .update(usersTable)
    .set({
      passwordHash: hashPassword(password),
      updatedAt: new Date(),
    })
    .where(eq(usersTable.id, payload.userId));

  passwordResetTokens.delete(token);

  return {
    ok: true,
    message: "Senha redefinida com sucesso.",
    userId: payload.userId,
  };
}

export async function attachSession(req: SessionRequest, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[SESSION_COOKIE];
    const session = token ? sessions.get(token) ?? null : null;

    if (!session) {
      req.session = null;
      return next();
    }

    if (session.expiresAt <= Date.now()) {
      sessions.delete(token);
      persistSessions();
      req.session = null;
      return next();
    }

    // Ghost Session Protection & Real-time Status Sync
    if (session.userId && session.role !== "admin") {
      const identity = await getIdentityByUserId(session.userId);
      if (!identity) {
        sessions.delete(token);
        persistSessions();
        res.clearCookie(SESSION_COOKIE, { path: "/" });
        req.session = null;
        return next();
      }

      // Re-sync billing status in real-time
      const rawUserStatus = (identity.user.billingStatus || "").toString().toLowerCase().trim();
      const rawHouseholdStatus = (identity.household?.billingStatus || "").toString().toLowerCase().trim();
      const isActive = rawUserStatus.includes("active") || 
                       rawUserStatus.includes("ativ") || 
                       rawHouseholdStatus.includes("active") || 
                       rawHouseholdStatus.includes("ativ");

      session.billingStatus = isActive ? "active" : (rawUserStatus || rawHouseholdStatus || "pending");
    }

    const refreshedSession = {
      ...session,
      expiresAt: buildSessionExpiry(session.role),
    };

    storeSession(refreshedSession);
    req.session = refreshedSession;
    next();
  } catch (error) {
    next(error);
  }
}

export function setSessionCookie(res: Response, session: SessionData) {
  res.cookie(SESSION_COOKIE, session.token, {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    path: "/",
    maxAge: SESSION_MAX_AGE_MS,
  });
}

export function clearSessionCookie(res: Response, req?: SessionRequest) {
  const token = req?.cookies?.[SESSION_COOKIE];
  if (token) {
    sessions.delete(token);
    persistSessions();
  }
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}

export function requireSession(req: SessionRequest, res: Response, next: NextFunction) {
  if (!req.session) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  next();
}

export function requireAdmin(req: SessionRequest, res: Response, next: NextFunction) {
  const masterEmail = process.env.MASTER_ADMIN_EMAIL?.trim().toLowerCase();
  if (!req.session || req.session.role !== "admin" || (masterEmail && req.session.email !== masterEmail)) {
    res.status(403).json({ error: "forbidden" });
    return;
  }
  next();
}

export function requireOwner(req: SessionRequest, res: Response, next: NextFunction) {
  if (!req.session || req.session.role !== "owner") {
    res.status(403).json({ error: "forbidden" });
    return;
  }
  next();
}

export function getSession(req: Request) {
  return (req as SessionRequest).session ?? null;
}

export function updateSessionProfile(
  req: Request,
  patch: Partial<Pick<SessionData, "name" | "email">>,
) {
  const sessionRequest = req as SessionRequest;
  const token = req.cookies?.[SESSION_COOKIE];

  if (!token || !sessionRequest.session) {
    return null;
  }

  const updated = {
    ...sessionRequest.session,
    ...patch,
  };

  storeSession(updated);
  sessionRequest.session = updated;
  return updated;
}

