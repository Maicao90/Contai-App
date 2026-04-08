import { and, eq, gte, isNull, or } from "drizzle-orm";
import {
  billsTable,
  commitmentsTable,
  db,
  googleCalendarConnectionsTable,
  householdMembersTable,
  remindersTable,
  usersTable,
} from "@workspace/db";

type GoogleTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  id_token?: string;
};

type GoogleUserInfo = {
  email?: string;
  name?: string;
};

type CalendarConnection = typeof googleCalendarConnectionsTable.$inferSelect;
type Commitment = typeof commitmentsTable.$inferSelect;
type Reminder = typeof remindersTable.$inferSelect;
type Bill = typeof billsTable.$inferSelect;
type CalendarSyncItemType = "commitment" | "reminder" | "bill";
type CalendarDraft = {
  summary: string;
  description: string;
  startAt: Date;
  endAt: Date;
};

const GOOGLE_AUTH_SCOPE = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/calendar",
].join(" ");

function getGoogleClientId() {
  return process.env.GOOGLE_CLIENT_ID?.trim() ?? "";
}

function getGoogleClientSecret() {
  return process.env.GOOGLE_CLIENT_SECRET?.trim() ?? "";
}

function getGoogleRedirectUri() {
  return (
    process.env.GOOGLE_REDIRECT_URI?.trim() ??
    "http://localhost:3001/api/google-calendar/callback"
  );
}

function getFrontendBaseUrl() {
  return process.env.APP_BASE_URL?.trim() ?? "https://contai.site";
}

export function isGoogleCalendarConfigured() {
  return Boolean(getGoogleClientId() && getGoogleClientSecret() && getGoogleRedirectUri());
}

function buildState(userId: number) {
  return Buffer.from(JSON.stringify({ userId })).toString("base64url");
}

export function parseGoogleState(state: string) {
  try {
    const parsed = JSON.parse(Buffer.from(state, "base64url").toString("utf8")) as {
      userId?: number;
    };
    return parsed.userId ? parsed : null;
  } catch {
    return null;
  }
}

export function buildGoogleCalendarAuthUrl(userId: number, loginHint?: string) {
  const params = new URLSearchParams({
    client_id: getGoogleClientId(),
    redirect_uri: getGoogleRedirectUri(),
    response_type: "code",
    access_type: "offline",
    // "select_account consent" força o seletor de contas sempre que o usuário clicar em conectar
    prompt: loginHint ? "consent" : "select_account consent",
    include_granted_scopes: "true",
    scope: GOOGLE_AUTH_SCOPE,
    state: buildState(userId),
  });

  // Se o usuário informou um e-mail preferido, pré-seleciona a conta no Google
  if (loginHint) {
    params.set("login_hint", loginHint);
  }

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function exchangeCodeForTokens(code: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: getGoogleClientId(),
      client_secret: getGoogleClientSecret(),
      redirect_uri: getGoogleRedirectUri(),
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    throw new Error("Não foi possível concluir a conexão com o Google Agenda.");
  }

  return (await response.json()) as GoogleTokenResponse;
}

async function refreshAccessToken(refreshToken: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: getGoogleClientId(),
      client_secret: getGoogleClientSecret(),
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error("Não foi possível renovar o acesso ao Google Agenda.");
  }

  return (await response.json()) as GoogleTokenResponse;
}

async function fetchGoogleUserInfo(accessToken: string) {
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as GoogleUserInfo;
}

async function getConnection(userId: number) {
  const [connection] = await db
    .select()
    .from(googleCalendarConnectionsTable)
    .where(eq(googleCalendarConnectionsTable.userId, userId))
    .limit(1);

  return connection ?? null;
}

async function forceRefreshAccessToken(connectionId: number, refreshToken: string) {
  const refreshed = await refreshAccessToken(refreshToken);
  
  const [updated] = await db
    .update(googleCalendarConnectionsTable)
    .set({
      accessToken: refreshed.access_token,
      status: "connected",
    })
    .where(eq(googleCalendarConnectionsTable.id, connectionId))
    .returning();

  return updated.accessToken;
}

async function withValidAccessToken(connection: CalendarConnection) {
  // Se não tem refresh token, não tem como renovar. Retorna o que tem.
  return connection.accessToken;
}

export async function connectGoogleCalendar(userId: number, code: string) {
  const tokens = await exchangeCodeForTokens(code);
  const profile = await fetchGoogleUserInfo(tokens.access_token);
  const existing = await getConnection(userId);

  if (existing) {
    const [updated] = await db
      .update(googleCalendarConnectionsTable)
      .set({
        googleEmail: profile?.email ?? existing.googleEmail,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? existing.refreshToken,
        status: "connected",
      })
      .where(eq(googleCalendarConnectionsTable.id, existing.id))
      .returning();

    return updated;
  }

  const [created] = await db
    .insert(googleCalendarConnectionsTable)
    .values({
      userId,
      googleEmail: profile?.email ?? null,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      status: "connected",
    })
    .returning();

  return created;
}

export async function disconnectGoogleCalendar(userId: number) {
  const connection = await getConnection(userId);
  if (!connection) {
    return null;
  }

  await db
    .update(googleCalendarConnectionsTable)
    .set({
      accessToken: null,
      refreshToken: null,
      status: "disconnected",
      googleEmail: null,
    })
    .where(eq(googleCalendarConnectionsTable.id, connection.id));

  return true;
}

export async function quickConnectGoogleCalendar(userId: number, targetEmail?: string) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    throw new Error("Usuário não encontrado.");
  }

  const emailToUse = targetEmail?.trim() || user.email || `${user.phone.replace(/\D/g, "")}@contai.local`;
  const existing = await getConnection(userId);

  if (existing) {
    const [updated] = await db
      .update(googleCalendarConnectionsTable)
      .set({
        googleEmail: emailToUse,
        accessToken: null,
        refreshToken: null,
        status: "prepared",
      })
      .where(eq(googleCalendarConnectionsTable.id, existing.id))
      .returning();

    return updated;
  }

  const [created] = await db
    .insert(googleCalendarConnectionsTable)
    .values({
      userId,
      googleEmail: emailToUse,
      accessToken: null,
      refreshToken: null,
      status: "prepared",
    })
    .returning();

  return created;
}

function buildFrontendRedirect(status: "connected" | "error", reason?: string) {
  const url = new URL("/app/integracoes", getFrontendBaseUrl());
  url.searchParams.set("google", status);
  if (reason) {
    url.searchParams.set("reason", reason);
  }
  return url.toString();
}

export function buildGoogleCalendarSuccessRedirect() {
  return buildFrontendRedirect("connected");
}

export function buildGoogleCalendarErrorRedirect(reason: string) {
  return buildFrontendRedirect("error", reason);
}

function buildCommitmentDraft(commitment: Commitment): CalendarDraft {
  const startAt = new Date(commitment.commitmentDate);
  return {
    summary: commitment.title,
    description: commitment.description ?? "Compromisso criado pelo Contai",
    startAt,
    endAt: new Date(startAt.getTime() + 60 * 60 * 1000),
  };
}

function buildReminderDraft(reminder: Reminder): CalendarDraft {
  const startAt = new Date(reminder.reminderDate);
  return {
    summary: `Lembrete: ${reminder.title}`,
    description: reminder.description ?? "Lembrete criado pelo Contai",
    startAt,
    endAt: new Date(startAt.getTime() + 30 * 60 * 1000),
  };
}

function buildBillDraft(bill: Bill): CalendarDraft {
  const startAt = new Date(bill.dueDate);
  const amountText = bill.amount ? ` Valor: R$ ${Number(bill.amount).toFixed(2).replace(".", ",")}.` : "";
  const summaryPrefix = bill.type === "receivable" ? "Recebimento" : "Vencimento";

  return {
    summary: `${summaryPrefix}: ${bill.title}`,
    description: `Lembrete de ${bill.type === "receivable" ? "recebimento" : "vencimento"} criado pelo Contai.${amountText}`,
    startAt,
    endAt: new Date(startAt.getTime() + 30 * 60 * 1000),
  };
}

async function createGoogleCalendarEvent(
  accessToken: string,
  draft: CalendarDraft,
  timezone: string,
  retryContext?: { userId: number; connectionId: number; refreshToken?: string | null }
) {
  const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      summary: draft.summary,
      description: draft.description,
      start: {
        dateTime: draft.startAt.toISOString(),
        timeZone: timezone,
      },
      end: {
        dateTime: draft.endAt.toISOString(),
        timeZone: timezone,
      },
    }),
  });

  if (response.status === 401 && retryContext?.refreshToken) {
    console.log(`[GOOGLE-CALENDAR] Token expirado para usuário ${retryContext.userId}. Tentando renovar...`);
    try {
      const newToken = await forceRefreshAccessToken(retryContext.connectionId, retryContext.refreshToken);
      if (newToken) {
        // Tenta novamente com o novo token
        return await createGoogleCalendarEvent(newToken, draft, timezone);
      }
    } catch (refreshErr) {
      console.error(`[GOOGLE-CALENDAR] Falha catastrófica ao renovar token para ${retryContext.userId}:`, refreshErr);
    }
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Falha ao criar o evento no Google Agenda.");
  }

  return (await response.json()) as { id: string; htmlLink?: string };
}

async function getCalendarAccessContext(userId: number) {
  const connection = await getConnection(userId);
  if (!connection || connection.status !== "connected" || !connection.accessToken) {
    return null;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    return null;
  }

  const accessToken = await withValidAccessToken(connection);
  return { 
    user, 
    connection, 
    accessToken: accessToken ?? connection.accessToken!,
    retryContext: {
      userId: user.id,
      connectionId: connection.id,
      refreshToken: connection.refreshToken
    }
  };
}

export async function syncCommitmentForUser(userId: number, commitment: Commitment) {
  const context = await getCalendarAccessContext(userId);
  if (!context) {
    return { synced: false, reason: "not_connected" as const };
  }

  const event = await createGoogleCalendarEvent(
    context.accessToken,
    buildCommitmentDraft(commitment),
    context.user.timezone,
    context.retryContext
  );

  await db
    .update(commitmentsTable)
    .set({
      googleCalendarEventId: event.id,
    })
    .where(eq(commitmentsTable.id, commitment.id));

  return { synced: true, eventId: event.id, htmlLink: event.htmlLink ?? null };
}

export async function syncReminderForUser(userId: number, reminder: Reminder) {
  const context = await getCalendarAccessContext(userId);
  if (!context) {
    return { synced: false, reason: "not_connected" as const };
  }

  const event = await createGoogleCalendarEvent(
    context.accessToken,
    buildReminderDraft(reminder),
    context.user.timezone,
    context.retryContext
  );

  await db
    .update(remindersTable)
    .set({
      googleCalendarEventId: event.id,
    })
    .where(eq(remindersTable.id, reminder.id));

  return { synced: true, eventId: event.id, htmlLink: event.htmlLink ?? null };
}

export async function syncBillForUser(userId: number, bill: Bill) {
  const context = await getCalendarAccessContext(userId);
  if (!context) {
    return { synced: false, reason: "not_connected" as const };
  }

  const event = await createGoogleCalendarEvent(
    context.accessToken,
    buildBillDraft(bill),
    context.user.timezone,
    context.retryContext
  );

  await db
    .update(billsTable)
    .set({
      googleCalendarEventId: event.id,
    })
    .where(eq(billsTable.id, bill.id));

  return { synced: true, eventId: event.id, htmlLink: event.htmlLink ?? null };
}

export async function syncOutstandingCalendarItemsForUser(userId: number) {
  const [member] = await db
    .select()
    .from(householdMembersTable)
    .where(eq(householdMembersTable.userId, userId))
    .limit(1);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  if (!member || !user?.householdId) {
    return {
      syncedCount: 0,
      syncedByType: { commitments: 0, reminders: 0, bills: 0 },
      items: [] as Array<{ id: number; title: string; type: CalendarSyncItemType; status: string }>,
    };
  }

  const now = new Date();

  const commitments = await db
    .select()
    .from(commitmentsTable)
    .where(
      and(
        eq(commitmentsTable.householdId, user.householdId),
        gte(commitmentsTable.commitmentDate, now),
        isNull(commitmentsTable.googleCalendarEventId),
        or(eq(commitmentsTable.memberId, member.id), eq(commitmentsTable.visibility, "shared")),
      ),
    );

  const reminders = await db
    .select()
    .from(remindersTable)
    .where(
      and(
        eq(remindersTable.householdId, user.householdId),
        gte(remindersTable.reminderDate, now),
        isNull(remindersTable.googleCalendarEventId),
        or(eq(remindersTable.memberId, member.id), isNull(remindersTable.memberId)),
      ),
    );

  const bills = await db
    .select()
    .from(billsTable)
    .where(
      and(
        eq(billsTable.householdId, user.householdId),
        gte(billsTable.dueDate, now),
        isNull(billsTable.googleCalendarEventId),
        or(eq(billsTable.memberId, member.id), eq(billsTable.visibility, "shared")),
      ),
    );

  const items: Array<{ id: number; title: string; type: CalendarSyncItemType; status: string }> = [];

  for (const commitment of commitments) {
    try {
      const result = await syncCommitmentForUser(userId, commitment);
      items.push({
        id: commitment.id,
        title: commitment.title,
        type: "commitment",
        status: result.synced ? "sincronizado" : "ignorado",
      });
    } catch {
      items.push({
        id: commitment.id,
        title: commitment.title,
        type: "commitment",
        status: "falhou",
      });
    }
  }

  for (const reminder of reminders) {
    try {
      const result = await syncReminderForUser(userId, reminder);
      items.push({
        id: reminder.id,
        title: reminder.title,
        type: "reminder",
        status: result.synced ? "sincronizado" : "ignorado",
      });
    } catch {
      items.push({
        id: reminder.id,
        title: reminder.title,
        type: "reminder",
        status: "falhou",
      });
    }
  }

  for (const bill of bills) {
    try {
      const result = await syncBillForUser(userId, bill);
      items.push({
        id: bill.id,
        title: bill.title,
        type: "bill",
        status: result.synced ? "sincronizado" : "ignorado",
      });
    } catch {
      items.push({
        id: bill.id,
        title: bill.title,
        type: "bill",
        status: "falhou",
      });
    }
  }

  return {
    syncedCount: items.filter((item) => item.status === "sincronizado").length,
    syncedByType: {
      commitments: items.filter((item) => item.type === "commitment" && item.status === "sincronizado").length,
      reminders: items.filter((item) => item.type === "reminder" && item.status === "sincronizado").length,
      bills: items.filter((item) => item.type === "bill" && item.status === "sincronizado").length,
    },
    items,
  };
}

export async function getGoogleCalendarStatus(userId: number) {
  const connection = await getConnection(userId);
  return {
    connection,
    oauthConfigured: isGoogleCalendarConfigured(),
    redirectUri: getGoogleRedirectUri(),
    canSync: Boolean(connection?.status === "connected" && connection.accessToken),
  };
}
