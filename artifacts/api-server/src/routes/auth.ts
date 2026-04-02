import { Router } from "express";
import {
  clearSessionCookie,
  createPasswordResetRequest,
  createSessionForUserId,
  createCredentialSession,
  createDemoSession,
  getSession,
  getAppBaseUrl,
  hashPassword,
  resetPasswordWithToken,
  setSessionCookie,
  type SessionRole,
} from "../lib/auth";
import { db, householdMembersTable, householdsTable, subscriptionsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createPrivateKey, createSign, randomUUID } from "node:crypto";
import { queueNotificationEvent } from "../lib/notifications";
import { registerReferralSignup } from "../lib/referrals";
import { normalizeBrazilPhone } from "../lib/phone";

const router = Router();
const DEFAULT_SIGNUP_CYCLE = "annual";
type SocialAuthSource = "login" | "signup";
type SocialAuthState = {
  source: SocialAuthSource;
  next?: string | null;
  ref?: string | null;
};

function isGoogleLoginConfigured() {
  return Boolean(
    process.env.GOOGLE_LOGIN_CLIENT_ID?.trim() &&
      process.env.GOOGLE_LOGIN_CLIENT_SECRET?.trim(),
  );
}

function isAppleLoginConfigured() {
  return Boolean(
    process.env.APPLE_CLIENT_ID?.trim() &&
      process.env.APPLE_REDIRECT_URI?.trim() &&
      process.env.APPLE_TEAM_ID?.trim() &&
      process.env.APPLE_KEY_ID?.trim() &&
      process.env.APPLE_PRIVATE_KEY?.trim(),
  );
}

function normalizePhone(value: string) {
  return normalizeBrazilPhone(value);
}

function normalizeCycle(value?: string | null) {
  return value === "monthly" ? "monthly" : "annual";
}

function planEndsAt(cycle?: string | null) {
  const base = new Date();
  return new Date(
    base.getTime() + (normalizeCycle(cycle) === "monthly" ? 30 : 365) * 24 * 60 * 60 * 1000,
  );
}

function decodeJwtPayload(token?: string | null) {
  if (!token) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function buildAuthRedirect(path: string, params?: Record<string, string>) {
  const url = new URL(path, getAppBaseUrl());
  Object.entries(params ?? {}).forEach(([key, value]) => url.searchParams.set(key, value));
  return url.toString();
}

function normalizeSocialSource(value: unknown): SocialAuthSource {
  return value === "signup" ? "signup" : "login";
}

function normalizeNextPath(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return null;
  }

  return trimmed;
}

function encodeSocialState(state: SocialAuthState) {
  return Buffer.from(JSON.stringify(state), "utf8").toString("base64url");
}

function decodeSocialState(value: unknown): SocialAuthState {
  if (!value || typeof value !== "string") {
    return { source: "login", next: null };
  }

  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as {
      source?: unknown;
      next?: unknown;
      ref?: unknown;
    };
    return {
      source: normalizeSocialSource(parsed.source),
      next: normalizeNextPath(parsed.next),
      ref: typeof parsed.ref === "string" ? parsed.ref.trim() : null,
    };
  } catch {
    return { source: "login", next: null, ref: null };
  }
}

function getSocialErrorRedirect(source: SocialAuthSource, provider: "google" | "apple") {
  return buildAuthRedirect(source === "signup" ? "/cadastro" : "/login", { auth: "error", provider });
}

async function ensureUserFromSocialProfile(input: {
  email?: string | null;
  name?: string | null;
  provider: "google" | "apple";
}) {
  const email = input.email?.trim().toLowerCase() ?? null;

  if (!email) {
    throw new Error("Não foi possivel identificar o e-mail dessa conta social.");
  }

  const [existingUser] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existingUser) {
    return { user: existingUser, isNew: false };
  }

  const baseName = input.name?.trim() || email.split("@")[0] || "Cliente Contai";
  const generatedPhone = `social${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90 + 10)}`;

  const [household] = await db
    .insert(householdsTable)
    .values({
      name: `Conta ${baseName}`,
      type: "individual",
      planType: "annual",
      billingStatus: "trial",
    })
    .returning();

  const [user] = await db
    .insert(usersTable)
    .values({
      householdId: household.id,
      name: baseName,
      phone: generatedPhone,
      email,
      passwordHash: hashPassword(randomUUID()),
      timezone: "America/Sao_Paulo",
      role: "owner",
      planType: "annual",
      billingStatus: "trial",
    })
    .returning();

  await db.insert(householdMembersTable).values({
    householdId: household.id,
    userId: user.id,
    displayName: baseName,
    memberType: "owner",
  });

  await db.update(householdsTable).set({ ownerUserId: user.id }).where(eq(householdsTable.id, household.id));

  await db.insert(subscriptionsTable).values({
    householdId: household.id,
    planName: "Plano Contai",
    paymentMethod: "trial",
    amount: "0.00",
    status: "trial",
    startedAt: new Date(),
    endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return { user, isNew: true };
}

function buildGoogleLoginUrl(source: SocialAuthSource, nextPath?: string | null, refCode?: string | null) {
  const clientId = process.env.GOOGLE_LOGIN_CLIENT_ID?.trim();
  const redirectUri =
    process.env.GOOGLE_LOGIN_REDIRECT_URI?.trim() ??
    `${getAppBaseUrl()}/api/auth/google/callback`;

  if (!clientId) {
    return null;
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
    state: encodeSocialState({ source, next: normalizeNextPath(nextPath), ref: refCode?.trim() || null }),
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function exchangeGoogleCode(code: string) {
  const clientId = process.env.GOOGLE_LOGIN_CLIENT_ID?.trim() ?? "";
  const clientSecret = process.env.GOOGLE_LOGIN_CLIENT_SECRET?.trim() ?? "";
  const redirectUri =
    process.env.GOOGLE_LOGIN_REDIRECT_URI?.trim() ??
    `${getAppBaseUrl()}/api/auth/google/callback`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    throw new Error("Não foi possivel validar o login com Google.");
  }

  return (await response.json()) as { access_token?: string; id_token?: string };
}

async function fetchGoogleProfile(accessToken: string) {
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Não foi possivel carregar os dados da conta Google.");
  }

  return (await response.json()) as { email?: string; name?: string };
}

function buildAppleLoginUrl(source: SocialAuthSource, nextPath?: string | null, refCode?: string | null) {
  const clientId = process.env.APPLE_CLIENT_ID?.trim();
  const redirectUri =
    process.env.APPLE_REDIRECT_URI?.trim() ??
    `${getAppBaseUrl()}/api/auth/apple/callback`;

  if (!clientId) {
    return null;
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    response_mode: "form_post",
    scope: "name email",
    state: encodeSocialState({ source, next: normalizeNextPath(nextPath), ref: refCode?.trim() || null }),
  });

  return `https://appleid.apple.com/auth/authorize?${params.toString()}`;
}

function buildAppleClientSecret() {
  const teamId = process.env.APPLE_TEAM_ID?.trim();
  const clientId = process.env.APPLE_CLIENT_ID?.trim();
  const keyId = process.env.APPLE_KEY_ID?.trim();
  const privateKey = process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!teamId || !clientId || !keyId || !privateKey) {
    return null;
  }

  const header = Buffer.from(JSON.stringify({ alg: "ES256", kid: keyId })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: teamId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
      aud: "https://appleid.apple.com",
      sub: clientId,
    }),
  ).toString("base64url");

  const unsigned = `${header}.${payload}`;
  const signer = createSign("SHA256");
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign(createPrivateKey(privateKey)).toString("base64url");
  return `${unsigned}.${signature}`;
}

async function exchangeAppleCode(code: string) {
  const clientId = process.env.APPLE_CLIENT_ID?.trim() ?? "";
  const redirectUri =
    process.env.APPLE_REDIRECT_URI?.trim() ??
    `${getAppBaseUrl()}/api/auth/apple/callback`;
  const clientSecret = buildAppleClientSecret();

  if (!clientSecret) {
    throw new Error("As credenciais da Apple não foram configuradas.");
  }

  const response = await fetch("https://appleid.apple.com/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    throw new Error("Não foi possivel validar o login com Apple.");
  }

  return (await response.json()) as { id_token?: string };
}

router.get("/auth/session", (req, res) => {
  res.json({ session: getSession(req) });
});

router.get("/auth/providers", (_req, res) => {
  res.json({
    google: {
      configured: isGoogleLoginConfigured(),
    },
    apple: {
      configured: isAppleLoginConfigured(),
    },
  });
});

router.post("/auth/demo-login", async (req, res, next) => {
  try {
    const role = ["user", "owner", "admin"].includes(req.body.role)
      ? (req.body.role as SessionRole)
      : "owner";
    const session = await createDemoSession(role);
    if (!session) {
      res.status(401).json({ message: "Demo login is not available." });
      return;
    }
    setSessionCookie(res, session);
    res.json({ session });
  } catch (error) {
    next(error);
  }
});

router.post("/auth/login", async (req, res, next) => {
  try {
    const identifier = String(req.body.identifier ?? "").trim();
    const password = String(req.body.password ?? "");

    if (!identifier || !password) {
      res.status(400).json({ message: "Informe seu login e sua senha." });
      return;
    }

    const session = await createCredentialSession(identifier, password);

    if (!session) {
      res.status(401).json({ message: "Login ou senha invalidos." });
      return;
    }

    setSessionCookie(res, session);
    res.json({ session });
  } catch (error) {
    next(error);
  }
});

router.post("/auth/signup", async (req, res, next) => {
  try {
    const name = String(req.body.name ?? "").trim();
    const email = String(req.body.email ?? "").trim().toLowerCase();
    const phone = String(req.body.phone ?? "").trim();
    const password = String(req.body.password ?? "");
    const refCode = String(req.body.refCode ?? "").trim();
    if (!name || !email || !phone || !password) {
      res.status(400).json({ message: "Preencha nome, e-mail, telefone e senha." });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ message: "A senha precisa ter pelo menos 6 caracteres." });
      return;
    }

    const users = await db.select().from(usersTable);
    const normalizedPhone = normalizePhone(phone);

    if (users.some((item) => item.email?.trim().toLowerCase() === email)) {
      res.status(409).json({ message: "Esse e-mail já está em uso." });
      return;
    }

    if (users.some((item) => normalizePhone(item.phone) === normalizedPhone)) {
      res.status(409).json({ message: "Esse telefone já está em uso." });
      return;
    }

    const firstName = name.split(" ").filter(Boolean)[0] ?? "Cliente";

    const [household] = await db
      .insert(householdsTable)
      .values({
        name: `Conta ${firstName}`,
        type: "individual",
        planType: DEFAULT_SIGNUP_CYCLE,
        billingStatus: "pending",
      })
      .returning();

    const [user] = await db
      .insert(usersTable)
      .values({
        householdId: household.id,
        name,
        phone: normalizedPhone,
        email,
        passwordHash: hashPassword(password),
        timezone: "America/Sao_Paulo",
        role: "owner",
        planType: DEFAULT_SIGNUP_CYCLE,
        billingStatus: "pending",
      })
      .returning();

    await db.insert(householdMembersTable).values({
      householdId: household.id,
      userId: user.id,
      displayName: name,
      memberType: "owner",
    });

    await db.update(householdsTable).set({ ownerUserId: user.id }).where(eq(householdsTable.id, household.id));

    await db.insert(subscriptionsTable).values({
      householdId: household.id,
      planName: "Plano Contai",
      cycle: DEFAULT_SIGNUP_CYCLE,
      paymentMethod: "pending",
      amount: "0.00",
      status: "pending",
      startedAt: new Date(),
      endsAt: planEndsAt(DEFAULT_SIGNUP_CYCLE),
    });

    if (refCode) {
      await registerReferralSignup({
        refCode,
        referredUserId: user.id,
      });
    }

    await queueNotificationEvent({
      template: "welcome",
      user,
      payload: {
        householdName: household.name,
        subscriptionStatus: "pending",
      },
    });

    const session = await createSessionForUserId(user.id);

    if (!session) {
      res.status(500).json({ message: "Não foi possível iniciar sua sessão." });
      return;
    }

    setSessionCookie(res, session);
    res.status(201).json({
      session,
      subscription: {
        planName: "Plano Contai",
        cycle: null,
        amount: null,
        status: "pending",
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/auth/logout", (req, res) => {
  clearSessionCookie(res, req);
  res.json({ ok: true });
});

router.post("/auth/forgot-password", async (req, res, next) => {
  try {
    const identifier = String(req.body.identifier ?? "").trim();
    if (!identifier) {
      res.status(400).json({ message: "Informe seu e-mail ou telefone." });
      return;
    }

    const result = await createPasswordResetRequest(identifier);

    if (result.ok && result.userId && result.resetUrl && result.email) {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, result.userId)).limit(1);
      if (user) {
        await queueNotificationEvent({
          template: "password_reset_requested",
          user,
          payload: {
            resetUrl: result.resetUrl,
          },
        });
      }
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/auth/reset-password", async (req, res, next) => {
  try {
    const token = String(req.body.token ?? "").trim();
    const password = String(req.body.password ?? "");

    if (!token || !password) {
      res.status(400).json({ message: "Informe o token e a nova senha." });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ message: "A nova senha precisa ter pelo menos 6 caracteres." });
      return;
    }

    const result = await resetPasswordWithToken(token, password);

    if (!result.ok) {
      res.status(400).json({ message: result.message });
      return;
    }

    if (result.userId) {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, result.userId)).limit(1);
      if (user) {
        await queueNotificationEvent({
          template: "password_changed",
          user,
        });
      }
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/auth/google/start", (req, res) => {
  const source = normalizeSocialSource(req.query.source);
  const nextPath = normalizeNextPath(req.query.next);
  const refCode = typeof req.query.ref === "string" ? req.query.ref.trim() : null;
  const url = buildGoogleLoginUrl(source, nextPath, refCode);
  if (!url) {
    res.redirect(getSocialErrorRedirect(source, "google"));
    return;
  }
  res.redirect(url);
});

router.get("/auth/google/callback", async (req, res) => {
  const state = decodeSocialState(req.query.state);
  const source = state.source;
  try {
    const code = String(req.query.code ?? "");
    if (!code) {
      res.redirect(getSocialErrorRedirect(source, "google"));
      return;
    }

    const tokens = await exchangeGoogleCode(code);
    const profile = await fetchGoogleProfile(tokens.access_token ?? "");
    const { user, isNew } = await ensureUserFromSocialProfile({
      email: profile.email,
      name: profile.name,
      provider: "google",
    });
    if (isNew && state.ref) {
      await registerReferralSignup({
        refCode: state.ref,
        referredUserId: user.id,
      });
    }
    if (isNew) {
      await queueNotificationEvent({
        template: "welcome",
        user,
        payload: {
          provider: "google",
          subscriptionStatus: "trial",
        },
      });
    }

    const session = await createSessionForUserId(user.id);

    if (!session) {
      res.redirect(getSocialErrorRedirect(source, "google"));
      return;
    }

    setSessionCookie(res, session);
    const redirectPath = state.next || (isNew ? "/assinatura" : "/app/dashboard");
    res.redirect(buildAuthRedirect(redirectPath, { auth: "google" }));
  } catch {
    res.redirect(getSocialErrorRedirect(source, "google"));
  }
});

router.get("/auth/apple/start", (req, res) => {
  const source = normalizeSocialSource(req.query.source);
  const nextPath = normalizeNextPath(req.query.next);
  const refCode = typeof req.query.ref === "string" ? req.query.ref.trim() : null;
  const url = buildAppleLoginUrl(source, nextPath, refCode);
  if (!url) {
    res.redirect(getSocialErrorRedirect(source, "apple"));
    return;
  }
  res.redirect(url);
});

router.post("/auth/apple/callback", async (req, res) => {
  const state = decodeSocialState(req.body.state);
  const source = state.source;
  try {
    const code = String(req.body.code ?? "");
    const rawUser = String(req.body.user ?? "");
    if (!code) {
      res.redirect(getSocialErrorRedirect(source, "apple"));
      return;
    }

    const tokens = await exchangeAppleCode(code);
    const idPayload = decodeJwtPayload(tokens.id_token);
    const appleUser = rawUser ? (JSON.parse(rawUser) as { name?: { firstName?: string; lastName?: string }; email?: string }) : null;
    const email = String(idPayload?.email ?? appleUser?.email ?? "").trim().toLowerCase() || null;
    const name = appleUser?.name
      ? `${appleUser.name.firstName ?? ""} ${appleUser.name.lastName ?? ""}`.trim()
      : String(idPayload?.email ?? "Cliente Apple").split("@")[0];

    const { user, isNew } = await ensureUserFromSocialProfile({
      email,
      name,
      provider: "apple",
    });
    if (isNew && state.ref) {
      await registerReferralSignup({
        refCode: state.ref,
        referredUserId: user.id,
      });
    }
    if (isNew) {
      await queueNotificationEvent({
        template: "welcome",
        user,
        payload: {
          provider: "apple",
          subscriptionStatus: "trial",
        },
      });
    }

    const session = await createSessionForUserId(user.id);

    if (!session) {
      res.redirect(getSocialErrorRedirect(source, "apple"));
      return;
    }

    setSessionCookie(res, session);
    const redirectPath = state.next || (isNew ? "/assinatura" : "/app/dashboard");
    res.redirect(buildAuthRedirect(redirectPath, { auth: "apple" }));
  } catch {
    res.redirect(getSocialErrorRedirect(source, "apple"));
  }
});

export default router;

