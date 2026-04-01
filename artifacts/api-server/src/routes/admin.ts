import { Router } from "express";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import {
  billsTable,
  commitmentsTable,
  conversationLogsTable,
  db,
  googleCalendarConnectionsTable,
  householdMembersTable,
  householdsTable,
  pendingDecisionsTable,
  remindersTable,
  subscriptionsTable,
  toAmountNumber,
  transactionsTable,
  usersTable,
  ensureDefaultReferralCampaign,
  ensurePermanentAdminUser,
} from "@workspace/db";
import { getSession, hashPassword, requireAdmin } from "../lib/auth";
import { logger } from "../lib/logger";
import type { IntegrationKey } from "../lib/integration-secrets";
import {
  appendIntegrationHistory,
  getIntegrationFieldKeys,
  getIntegrationHistory,
  getIntegrationStoredValues,
  saveIntegrationStoredValues,
} from "../lib/integration-secrets";
import { getGoogleCalendarStatus } from "../lib/google-calendar";
import { queueNotificationEvent, verifyEmailTransport } from "../lib/notifications";
import { markReferralPaidFromHousehold } from "../lib/referrals";
import { getSystemSettings, updateSystemSettings } from "../lib/system-settings";
import { getBotPromptPreview } from "../lib/openai-client";
import { previewBotMessage, type BotPreviewScenario } from "../lib/contai-engine";
import { normalizeBrazilPhone } from "../lib/phone";

const router = Router();
const PLAN_NAME = "Plano Contai";
const PLAN_MONTHLY_AMOUNT = 14.9;
const PLAN_ANNUAL_AMOUNT = 99.9;
const MEMBER_LIMIT = 2;

function normalizePlanType(value?: string | null) {
  return value === "monthly" ? "monthly" : "annual";
}

function planAmount(planType?: string | null) {
  return normalizePlanType(planType) === "monthly" ? PLAN_MONTHLY_AMOUNT : PLAN_ANNUAL_AMOUNT;
}

function planEndsAt(planType?: string | null, base = new Date()) {
  return addDays(base, normalizePlanType(planType) === "monthly" ? 30 : 365);
}

type IntegrationField = {
  key: string;
  label: string;
  placeholder: string;
  secret?: boolean;
  required?: boolean;
  helpText?: string;
};

const integrationLabels: Record<IntegrationKey, string> = {
  whatsapp: "WhatsApp Cloud API",
  openai: "OpenAI",
  gemini: "Gemini",
  "google-calendar": "Google Agenda",
  cakto: "Cakto",
  utmify: "UTMify",
  email: "E-mail transacional",
  supabase: "Supabase (Banco de Dados)",
};

const integrationFields: Record<IntegrationKey, IntegrationField[]> = {
  whatsapp: [
    {
      key: "META_ACCESS_TOKEN",
      label: "Access Token da Meta",
      placeholder: "EAA...",
      secret: true,
      required: true,
      helpText: "Token principal para enviar e validar mensagens no WhatsApp Cloud API.",
    },
    {
      key: "META_PHONE_NUMBER_ID",
      label: "Phone Number ID",
      placeholder: "123456789012345",
      required: true,
      helpText: "Identificador do número conectado no app da Meta.",
    },
    {
      key: "META_WEBHOOK_VERIFY_TOKEN",
      label: "Webhook Verify Token",
      placeholder: "contai-webhook-token",
      secret: true,
      helpText: "Usado na verificação inicial do webhook da Meta.",
    },
    {
      key: "META_GRAPH_VERSION",
      label: "Versão da Graph API",
      placeholder: "v21.0",
      helpText: "Versão usada para as chamadas da Meta.",
    },
  ],
  openai: [
    {
      key: "OPENAI_API_KEY",
      label: "OpenAI API Key",
      placeholder: "sk-...",
      secret: true,
      required: true,
      helpText: "Chave principal usada para interpretar texto, áudio e imagem.",
    },
    {
      key: "OPENAI_CHAT_MODEL",
      label: "Modelo de texto",
      placeholder: "gpt-4o-mini",
      helpText: "Modelo usado para entender mensagens de texto.",
    },
    {
      key: "OPENAI_VISION_MODEL",
      label: "Modelo de imagem",
      placeholder: "gpt-4o-mini",
      helpText: "Modelo usado para analisar imagens e comprovantes.",
    },
    {
      key: "OPENAI_TRANSCRIBE_MODEL",
      label: "Modelo de transcrição",
      placeholder: "gpt-4o-mini-transcribe",
      helpText: "Modelo usado para transcrever áudios do WhatsApp.",
    },
  ],
  gemini: [
    {
      key: "GEMINI_API_KEY",
      label: "Gemini API Key",
      placeholder: "AIza...",
      secret: true,
      required: true,
      helpText: "Chave do Gemini para testes e uso futuro no Contai.",
    },
  ],
  "google-calendar": [
    {
      key: "GOOGLE_CLIENT_ID",
      label: "Google Client ID",
      placeholder: "xxxxx.apps.googleusercontent.com",
      required: true,
      helpText: "Client ID do OAuth do Google Cloud.",
    },
    {
      key: "GOOGLE_CLIENT_SECRET",
      label: "Google Client Secret",
      placeholder: "GOCSPX-...",
      secret: true,
      required: true,
      helpText: "Segredo do app OAuth usado para conectar o Google Agenda.",
    },
    {
      key: "GOOGLE_REDIRECT_URI",
      label: "Redirect URI",
      placeholder: "http://localhost:3000/api/google-calendar/callback",
      required: true,
      helpText: "URL de retorno cadastrada no Google Cloud.",
    },
  ],
  cakto: [
    {
      key: "CAKTO_API_TOKEN",
      label: "API Token da Cakto",
      placeholder: "cakto_live_...",
      secret: true,
      required: true,
      helpText: "Token principal para usar a Cakto como checkout oficial do Contai.",
    },
    {
      key: "CAKTO_WEBHOOK_SECRET",
      label: "Webhook Secret",
      placeholder: "cakto-webhook-secret",
      secret: true,
      helpText: "Segredo usado para validar os webhooks da Cakto.",
    },
    {
      key: "CAKTO_CHECKOUT_BASE_URL",
      label: "URL base do checkout",
      placeholder: "https://pay.cakto.com.br",
      required: true,
      helpText: "Base usada para os links de checkout mensal e anual.",
    },
    {
      key: "CAKTO_PRODUCT_MONTHLY_ID",
      label: "ID do produto mensal",
      placeholder: "contai-mensal",
      required: true,
      helpText: "Identificador do produto ou oferta mensal na Cakto.",
    },
    {
      key: "CAKTO_PRODUCT_ANNUAL_ID",
      label: "ID do produto anual",
      placeholder: "contai-anual",
      required: true,
      helpText: "Identificador do produto ou oferta anual na Cakto.",
    },
  ],
  utmify: [
    {
      key: "UTMIFY_API_TOKEN",
      label: "API Token da UTMify",
      placeholder: "utmify_...",
      secret: true,
      required: true,
      helpText: "Token usado para rastrear origem e conversões do Contai.",
    },
    {
      key: "UTMIFY_BASE_URL",
      label: "URL base da UTMify",
      placeholder: "https://api.utmify.com.br",
      required: true,
      helpText: "Base usada para enviar conversões e validar a conexão.",
    },
    {
      key: "UTMIFY_PROJECT_ID",
      label: "Project ID",
      placeholder: "contai",
      helpText: "Projeto ou workspace usado dentro da UTMify.",
    },
    {
      key: "UTMIFY_WEBHOOK_SECRET",
      label: "Webhook Secret",
      placeholder: "utmify-webhook-secret",
      secret: true,
      helpText: "Segredo opcional para conciliar eventos vindos da UTMify.",
    },
  ],
  email: [
    {
      key: "SMTP_HOST",
      label: "Servidor SMTP",
      placeholder: "smtp.seuprovedor.com",
      required: true,
      helpText: "Servidor SMTP usado nos relatórios mensais e notificações.",
    },
    {
      key: "SMTP_PORT",
      label: "Porta SMTP",
      placeholder: "587",
      required: true,
      helpText: "Porta da conexão SMTP.",
    },
    {
      key: "SMTP_USER",
      label: "Usuário SMTP",
      placeholder: "no-reply@contai.app",
      required: true,
      helpText: "Usuário de autenticação do e-mail.",
    },
    {
      key: "SMTP_PASSWORD",
      label: "Senha SMTP",
      placeholder: "••••••••",
      secret: true,
      required: true,
      helpText: "Senha ou app password da conta de envio.",
    },
    {
      key: "SMTP_FROM_EMAIL",
      label: "E-mail remetente",
      placeholder: "no-reply@contai.app",
      required: true,
      helpText: "Endereço usado como remetente padrão do sistema.",
    },
    {
      key: "SMTP_FROM_NAME",
      label: "Nome do remetente",
      placeholder: "Contai",
      helpText: "Nome exibido nos e-mails enviados.",
    },
  ],
  supabase: [
    {
      key: "DATABASE_URL",
      label: "PostgreSQL Connection String",
      placeholder: "postgresql://postgres:...@...pooler.supabase.com:6543/postgres",
      required: true,
      secret: true,
      helpText: "Conexão na aba de configurações de Database do Supabase (use a de pooler que termina com 6543). Importante: alterar esse valor exige reiniciar o servidor local para ter efeito.",
    },
    {
      key: "SUPABASE_URL",
      label: "Supabase Project URL",
      placeholder: "https://seu-projeto.supabase.co",
      required: true,
      helpText: "URL do projeto na aba de configurações de API do Supabase.",
    },
    {
      key: "SUPABASE_ANON_KEY",
      label: "Supabase Anon Key",
      placeholder: "eyJhbGc...",
      required: true,
      secret: true,
      helpText: "Chave pública anônima do projeto (Anon public).",
    },
    {
      key: "SUPABASE_SERVICE_ROLE_KEY",
      label: "Supabase Service Role Key",
      placeholder: "eyJhbGc...",
      secret: true,
      helpText: "Chave secreta com poderes administrativos (opcional para rotinas backend).",
    },
  ],
};

type IntegrationTestResult = {
  status: "connected" | "disconnected" | "error";
  message: string;
  latencyMs: number | null;
  response: string | null;
  latestSync: string | null;
};

function buildIntegrationHints(key: IntegrationKey) {
  const appBaseUrl = process.env.APP_BASE_URL?.trim() || "https://contai.site";
  const apiBaseUrl = process.env.API_BASE_URL?.trim() || "http://localhost:3000";

  if (key === "whatsapp") {
    return [
      {
        label: "Webhook URL",
        value: `${apiBaseUrl}/api/whatsapp/webhook`,
      },
      {
        label: "Verify Token esperado",
        value: process.env.META_WEBHOOK_VERIFY_TOKEN?.trim() || "defina o token no painel",
      },
    ];
  }

  if (key === "google-calendar") {
    return [
      {
        label: "Callback do Google",
        value: `${apiBaseUrl}/api/google-calendar/callback`,
      },
      {
        label: "Tela de integrações do usuário",
        value: `${appBaseUrl}/app/integracoes`,
      },
    ];
  }

  if (key === "openai") {
    return [
      {
        label: "Uso principal",
        value: "Interpretação de texto, transcrição de áudio e análise de imagem do Contai.",
      },
    ];
  }

  if (key === "cakto") {
    return [
      {
        label: "Fluxo atual",
        value: `${appBaseUrl}/assinatura`,
      },
      {
        label: "Base esperada do checkout",
        value: process.env.CAKTO_CHECKOUT_BASE_URL?.trim() || "defina a URL base da Cakto no painel",
      },
    ];
  }

  if (key === "utmify") {
    return [
      {
        label: "Página principal rastreada",
        value: appBaseUrl,
      },
      {
        label: "Base da API",
        value: process.env.UTMIFY_BASE_URL?.trim() || "defina a URL base da UTMify no painel",
      },
    ];
  }

  if (key === "email") {
    return [
      {
        label: "Uso principal",
        value: "Relatórios mensais, confirmação de pagamento e notificações operacionais do Contai.",
      },
    ];
  }

  if (key === "supabase") {
    return [
      {
        label: "Uso principal",
        value: "Armazena todos os usuários, membros, financeiro e mensagens do sistema.",
      },
      {
        label: "Alerta Crítico",
        value: "Alterar a DATABASE_URL exige reiniciar o servidor Node.js.",
      },
      {
        label: "Conexão de Pooler (URL)",
        value: "Ao copiar a DATABASE_URL no seu projeto do Supabase (Aba Database), ative a checkbox 'Use connection pooling' e selecione 'Session'. A porta deve ser 6543.",
      },
    ];
  }

  return [
    {
      label: "Uso principal",
      value: "Integração opcional preparada para expansão do motor do Contai.",
    },
  ];
}

router.use("/admin", requireAdmin);

function normalizeStatus(status?: string | null) {
  if (!status) return "trial";
  if (status === "trial") return "active";
  if (status === "past_due") return "expired";
  return status;
}

function accountType(type?: string | null) {
  return type === "couple" || type === "family" ? "shared" : "individual";
}

function isInternalTestText(value?: string | null) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized.includes("teste") || normalized.includes("test");
}

function isInternalTestUser(user: (typeof usersTable.$inferSelect)) {
  return isInternalTestText(user.name) || isInternalTestText(user.email);
}

function isInternalTestHousehold(household: (typeof householdsTable.$inferSelect)) {
  return isInternalTestText(household.name);
}

function isPresent<T>(value: T | null): value is T {
  return value !== null;
}

function startOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function dayKey(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString().slice(0, 10);
}

async function loadData() {
  const [users, households, members, subscriptions, logs, transactions, commitments, pendings, bills] =
    await Promise.all([
      db.select().from(usersTable).orderBy(desc(usersTable.createdAt)),
      db.select().from(householdsTable),
      db.select().from(householdMembersTable),
      db.select().from(subscriptionsTable).orderBy(desc(subscriptionsTable.createdAt)),
      db.select().from(conversationLogsTable).orderBy(desc(conversationLogsTable.createdAt)),
      db.select().from(transactionsTable).orderBy(desc(transactionsTable.transactionDate)),
      db.select().from(commitmentsTable).orderBy(desc(commitmentsTable.commitmentDate)),
      db.select().from(pendingDecisionsTable).orderBy(desc(pendingDecisionsTable.createdAt)),
      db.select().from(billsTable).orderBy(desc(billsTable.dueDate)),
    ]);
  return { users, households, members, subscriptions, logs, transactions, commitments, pendings, bills };
}

function mapUsers(data: Awaited<ReturnType<typeof loadData>>) {
  return data.users
    .filter((user) => user.role !== "admin")
    .filter((user) => !isInternalTestUser(user))
    .map((user) => {
    const household = data.households.find((item) => item.id === user.householdId) ?? null;
    const householdMembers = data.members.filter((item) => item.householdId === user.householdId);
    const ownerMember = householdMembers.find((item) => item.memberType === "owner");
    const ownerUser = data.users.find((item) => item.id === ownerMember?.userId) ?? null;
    const member = data.members.find((item) => item.userId === user.id) ?? null;
    const userLogs = data.logs.filter((item) => item.userId === user.id);
    const userTransactions = data.transactions.filter(
      (item) => item.createdBy === user.name || (member ? item.memberId === member.id : false),
    );
    const userCommitments = data.commitments.filter((item) => (member ? item.memberId === member.id : false));
    const subscription = data.subscriptions.find((item) => item.householdId === user.householdId) ?? null;
    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role === "partner" ? "partner" : "owner",
      status: normalizeStatus(user.billingStatus),
      householdId: user.householdId,
      householdName: household?.name ?? "Sem conta",
      householdType: accountType(household?.type),
      membersCount: householdMembers.length,
      ownerName: ownerUser?.name ?? user.name,
      lastActivityAt: userLogs[0]?.createdAt ?? user.updatedAt ?? user.createdAt,
      usageCount: userLogs.length,
      messagesCount: userLogs.length,
      transactionsCount: userTransactions.length,
      commitmentsCount: userCommitments.length,
      planName: PLAN_NAME,
      subscriptionStartedAt: subscription?.startedAt ?? user.createdAt,
      subscriptionEndsAt: subscription?.endsAt ?? null,
    };
  });
}

function mapHouseholds(data: Awaited<ReturnType<typeof loadData>>) {
  return data.households.filter((household) => !isInternalTestHousehold(household)).map((household) => {
    const householdMembers = data.members.filter((item) => item.householdId === household.id);
    const ownerMember = householdMembers.find((item) => item.memberType === "owner");
    const ownerUser = data.users.find((item) => item.id === ownerMember?.userId) ?? null;
    const subscription = data.subscriptions.find((item) => item.householdId === household.id) ?? null;
    const logs = data.logs.filter((item) => item.householdId === household.id);
    return {
      id: household.id,
      name: household.name,
      type: accountType(household.type),
      membersCount: householdMembers.length,
      ownerName: ownerUser?.name ?? "Sem titular",
      subscriptionStatus: normalizeStatus(subscription?.status ?? household.billingStatus),
      renewalDate: subscription?.endsAt ?? null,
      lastActivityAt: logs[0]?.createdAt ?? household.updatedAt ?? household.createdAt,
      totalTransactions: data.transactions.filter((item) => item.householdId === household.id).length,
      totalCommitments: data.commitments.filter((item) => item.householdId === household.id).length,
      planName: PLAN_NAME,
    };
  });
}

function mapSubscriptions(data: Awaited<ReturnType<typeof loadData>>) {
  return data.subscriptions.map((subscription) => {
    const household = data.households.find((item) => item.id === subscription.householdId) ?? null;
    if (!household || isInternalTestHousehold(household)) {
      return null;
    }
    const members = data.members.filter((item) => item.householdId === subscription.householdId);
    const ownerMember = members.find((item) => item.memberType === "owner");
    const ownerUser = data.users.find((item) => item.id === ownerMember?.userId) ?? null;
    return {
      id: subscription.id,
      householdId: subscription.householdId,
      householdName: household?.name ?? "Sem conta",
      ownerName: ownerUser?.name ?? "Sem titular",
      status: normalizeStatus(subscription.status),
      amount: toAmountNumber(subscription.amount),
      cycle: normalizePlanType(household.planType),
      startedAt: subscription.startedAt,
      renewalDate: subscription.endsAt,
      paymentMethod: subscription.paymentMethod,
      membersCount: members.length,
      planName: PLAN_NAME,
    };
  }).filter(isPresent);
}

function mapConversations(data: Awaited<ReturnType<typeof loadData>>) {
  return data.logs.map((log) => {
    const user = data.users.find((item) => item.id === log.userId);
    const household = data.households.find((item) => item.id === log.householdId);
    if ((user && isInternalTestUser(user)) || (household && isInternalTestHousehold(household))) {
      return null;
    }
    const member = data.members.find((item) => item.id === log.memberId);
    const pending = data.pendings.find((item) => item.userId === log.userId);
    return {
      id: log.id,
      userName: user?.name ?? "Sem usuÃ¡rio",
      householdName: household?.name ?? "Sem conta",
      memberName: member?.displayName ?? null,
      originalContent: log.originalContent,
      content: log.content,
      sourceType: log.sourceType,
      intent: log.intent,
      direction: log.direction,
      createdAt: log.createdAt,
      processingStatus: pending ? "pending" : "processed",
      engine: log.sourceType !== "text" || log.intent === "indefinido" ? "ai" : "rule",
      error: pending?.question ?? null,
      transcribedContent: log.transcribedContent,
      imageAnalysis: log.imageAnalysis,
      structuredData: log.structuredData,
    };
  }).filter(isPresent);
}

function normalizeIntegrationKey(value: string): IntegrationKey | null {
  if (
    value === "whatsapp" ||
    value === "openai" ||
    value === "gemini" ||
    value === "google-calendar" ||
    value === "cakto" ||
    value === "utmify" ||
    value === "email" ||
    value === "supabase"
  ) {
    return value;
  }
  return null;
}

function maskSecretValue(value: string) {
  if (!value) return "";
  if (value.length <= 8) return "•".repeat(value.length);
  return `${value.slice(0, 4)}${"•".repeat(Math.max(4, value.length - 8))}${value.slice(-4)}`;
}

const INTEGRATION_SETTINGS_UPDATED_MESSAGE = "Configurações atualizadas pelo painel administrativo.";
const INTEGRATION_SETTINGS_PENDING_MESSAGE = "Configurações salvas. Execute um teste para validar a conexão.";

function sanitizeSensitiveText(value: string | null | undefined) {
  if (!value) return value ?? null;

  return value
    .replace(/\bsk-[A-Za-z0-9_-]{12,}\b/g, "sk-••••••••")
    .replace(/\bEAA[A-Za-z0-9_-]{12,}\b/g, "EAA••••••••")
    .replace(/\bAIza[0-9A-Za-z_-]{12,}\b/g, "AIza••••••••")
    .replace(/("message"\s*:\s*"Incorrect API key provided:\s*)[^"]+/gi, '$1••••••••')
    .replace(/(Bearer\s+)[A-Za-z0-9._-]{12,}/gi, "$1••••••••");
}

function parseJsonBody<T>(value: unknown): T | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as T;
}

function normalizeIntegrationFieldValue(fieldKey: string, rawValue: unknown) {
  const value = String(rawValue ?? "").trim();
  const tokenLikeFields = new Set([
    "META_ACCESS_TOKEN",
    "META_PHONE_NUMBER_ID",
    "META_WEBHOOK_VERIFY_TOKEN",
    "META_GRAPH_VERSION",
    "OPENAI_API_KEY",
    "OPENAI_CHAT_MODEL",
    "OPENAI_VISION_MODEL",
    "OPENAI_TRANSCRIBE_MODEL",
    "GEMINI_API_KEY",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "CAKTO_API_TOKEN",
    "CAKTO_WEBHOOK_SECRET",
    "CAKTO_PRODUCT_MONTHLY_ID",
    "CAKTO_PRODUCT_ANNUAL_ID",
    "UTMIFY_API_TOKEN",
    "UTMIFY_PROJECT_ID",
    "UTMIFY_WEBHOOK_SECRET",
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASSWORD",
    "SMTP_FROM_EMAIL",
    "DATABASE_URL",
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ]);

  if (tokenLikeFields.has(fieldKey)) {
    return value.split(/\s+/)[0] ?? "";
  }

  return value;
}

function isOperationalHistoryEntry(item: { message: string }) {
  return item.message !== INTEGRATION_SETTINGS_UPDATED_MESSAGE && item.message !== INTEGRATION_SETTINGS_PENDING_MESSAGE;
}

function lastOperationalHistoryEntry(
  items: Array<{ status: string; message: string; at: string; latencyMs?: number | null; response?: string | null }>,
) {
  return items.find((item) => isOperationalHistoryEntry(item)) ?? null;
}

function lastFailureEntry(items: Array<{ status: string; message: string; at: string; latencyMs?: number | null; response?: string | null }>) {
  return items.find((item) => isOperationalHistoryEntry(item) && item.status === "error") ?? null;
}

async function getGoogleConnectionMetrics() {
  const connections = await db.select().from(googleCalendarConnectionsTable);
  return {
    total: connections.length,
    connected: connections.filter((item) => item.status === "connected" && item.accessToken).length,
    prepared: connections.filter((item) => item.status === "prepared").length,
    latestSync:
      connections
        .map((item) => item.createdAt)
        .sort((a, b) => +new Date(b) - +new Date(a))[0] ?? null,
  };
}

async function runIntegrationTest(key: IntegrationKey): Promise<IntegrationTestResult> {
  const startedAt = Date.now();
  const values = await getIntegrationStoredValues(key);

  try {
    if (key === "whatsapp") {
      const token = values.META_ACCESS_TOKEN?.trim();
      const phoneNumberId = values.META_PHONE_NUMBER_ID?.trim();
      const graphVersion = values.META_GRAPH_VERSION?.trim() || "v21.0";

      if (!token || !phoneNumberId) {
        throw new Error("Preencha o Access Token e o Phone Number ID para testar o WhatsApp.");
      }

      const response = await fetch(
        `https://graph.facebook.com/${graphVersion}/${phoneNumberId}?fields=id,display_phone_number,verified_name`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const raw = sanitizeSensitiveText(await response.text()) ?? "";
      if (!response.ok) {
        throw new Error(raw || "A Meta recusou a conexão.");
      }

      let parsed: Record<string, unknown> | null = null;
      try {
        parsed = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        parsed = null;
      }

      const displayPhoneNumber = String(parsed?.display_phone_number ?? phoneNumberId);
      return {
        status: "connected",
        message: `Conexão validada com o número ${displayPhoneNumber}.`,
        latencyMs: Date.now() - startedAt,
        response: raw,
        latestSync: null,
      };
    }

    if (key === "openai") {
      const apiKey = values.OPENAI_API_KEY?.trim();
      if (!apiKey) {
        throw new Error("Preencha a OpenAI API Key para testar a conexão.");
      }

      const response = await fetch("https://api.openai.com/v1/models", {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      const raw = sanitizeSensitiveText(await response.text()) ?? "";
      if (!response.ok) {
        throw new Error(raw || "A OpenAI recusou a conexão.");
      }

      return {
        status: "connected",
        message: "Chave da OpenAI validada com sucesso.",
        latencyMs: Date.now() - startedAt,
        response: raw,
        latestSync: null,
      };
    }

    if (key === "gemini") {
      const apiKey = values.GEMINI_API_KEY?.trim();
      if (!apiKey) {
        throw new Error("Preencha a Gemini API Key para testar a conexão.");
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
      );

      const raw = sanitizeSensitiveText(await response.text()) ?? "";
      if (!response.ok) {
        throw new Error(raw || "O Gemini recusou a conexão.");
      }

      return {
        status: "connected",
        message: "Chave do Gemini validada com sucesso.",
        latencyMs: Date.now() - startedAt,
        response: raw,
        latestSync: null,
      };
    }

    if (key === "cakto") {
      const token = values.CAKTO_API_TOKEN?.trim();
      const baseUrl = values.CAKTO_CHECKOUT_BASE_URL?.trim();
      const monthlyId = values.CAKTO_PRODUCT_MONTHLY_ID?.trim();
      const annualId = values.CAKTO_PRODUCT_ANNUAL_ID?.trim();

      if (!token || !baseUrl || !monthlyId || !annualId) {
        throw new Error("Preencha token, URL base e os IDs mensal/anual para ativar a Cakto.");
      }

      return {
        status: "connected",
        message: "Configuração da Cakto pronta no painel para mensal e anual.",
        latencyMs: Date.now() - startedAt,
        response: sanitizeSensitiveText(JSON.stringify({
          checkoutBaseUrl: baseUrl,
          monthlyProductId: monthlyId,
          annualProductId: annualId,
        })),
        latestSync: null,
      };
    }

    if (key === "utmify") {
      const token = values.UTMIFY_API_TOKEN?.trim();
      const baseUrl = values.UTMIFY_BASE_URL?.trim();

      if (!token || !baseUrl) {
        throw new Error("Preencha token e URL base para ativar a UTMify.");
      }

      return {
        status: "connected",
        message: "Configuração da UTMify pronta para rastrear campanhas e vendas.",
        latencyMs: Date.now() - startedAt,
        response: sanitizeSensitiveText(JSON.stringify({
          baseUrl,
          projectId: values.UTMIFY_PROJECT_ID?.trim() || null,
        })),
        latestSync: null,
      };
    }

    if (key === "email") {
      const config = await verifyEmailTransport();

      return {
        status: "connected",
        message: "SMTP validado com sucesso para relatórios e notificações.",
        latencyMs: Date.now() - startedAt,
        response: sanitizeSensitiveText(JSON.stringify({
          host: config.host,
          port: config.port,
          fromEmail: config.fromEmail,
          fromName: config.fromName,
        })),
        latestSync: null,
      };
    }

    if (key === "supabase") {
      const dbUrl = values.DATABASE_URL?.trim();
      const supUrl = values.SUPABASE_URL?.trim();
      const anon = values.SUPABASE_ANON_KEY?.trim();

      if (!dbUrl || !supUrl || !anon) {
        throw new Error("Preencha ao menos a String de Conexão, a URL do Projeto e a chave Anon para validar.");
      }

      // Validação de REST API com Anon.
      const response = await fetch(`${supUrl}/rest/v1/`, {
        headers: {
          apikey: anon,
          Authorization: `Bearer ${anon}`,
        },
      });

      const raw = sanitizeSensitiveText(await response.text()) ?? "";
      if (!response.ok && !raw.includes("Accessing the schema via the Data API")) {
        throw new Error(raw || "O Supabase recursou a conexão REST com as chaves informadas.");
      }

      return {
        status: "connected",
        message: "Chaves do Supabase validadas. Se você alterou a 'Connection String', reinicie o console local (iniciar-prospectalp) para surtir efeito e utilizar este novo banco.",
        latencyMs: Date.now() - startedAt,
        response: raw,
        latestSync: null,
      };
    }

    const googleStatus = await getGoogleCalendarStatus(1);
    const connectionMetrics = await getGoogleConnectionMetrics();
    if (!googleStatus.oauthConfigured) {
      throw new Error("Preencha Client ID, Client Secret e Redirect URI para ativar o Google Agenda.");
    }

    return {
      status: "connected",
      message:
        connectionMetrics.connected > 0
          ? `${connectionMetrics.connected} conta(s) já conectada(s) ao Google Agenda.`
          : "OAuth do Google Agenda configurado e pronto para novas conexões.",
      latencyMs: Date.now() - startedAt,
        response: sanitizeSensitiveText(JSON.stringify({
          redirectUri: googleStatus.redirectUri,
          connectedAccounts: connectionMetrics.connected,
          preparedAccounts: connectionMetrics.prepared,
        })),
        latestSync: connectionMetrics.latestSync ? new Date(connectionMetrics.latestSync).toISOString() : null,
      };
  } catch (error) {
    const message =
      error instanceof Error
        ? sanitizeSensitiveText(error.message) ?? "Não foi possível validar a integração agora."
        : "Não foi possível validar a integração agora.";

    return {
      status: "error",
      message,
      latencyMs: Date.now() - startedAt,
      response: null,
      latestSync: null,
    };
  }
}

async function buildIntegrationSummary(key: IntegrationKey) {
  const history = await getIntegrationHistory(key);
  const values = await getIntegrationStoredValues(key);
  const requiredFields = integrationFields[key].filter((field) => field.required).map((field) => field.key);
  const configuredFields = getIntegrationFieldKeys(key).filter((field) => Boolean(values[field]?.trim()));
  const allRequiredPresent = requiredFields.every((field) => Boolean(values[field]?.trim()));
  const lastEntry = lastOperationalHistoryEntry(history);
  const lastFailure = lastFailureEntry(history);
  const derivedStatus =
    lastEntry?.status === "error"
      ? "error"
      : lastEntry?.status === "connected" && allRequiredPresent
        ? "connected"
        : "disconnected";
  const visibleFailure =
    derivedStatus === "error"
      ? sanitizeSensitiveText(lastFailure?.message) ?? (!allRequiredPresent ? "Credenciais ausentes" : null)
      : derivedStatus === "disconnected" && !allRequiredPresent
        ? "Credenciais ausentes"
        : null;

  if (key === "google-calendar") {
    const googleStatus = await getGoogleConnectionMetrics();
    const status =
      lastEntry?.status === "error"
        ? "error"
        : lastEntry?.status === "connected" || googleStatus.connected > 0 || googleStatus.prepared > 0
          ? "connected"
          : "disconnected";
    return {
      key,
      name: integrationLabels[key],
      status,
      lastCheckedAt: lastEntry?.at ?? null,
      lastFailure:
        status === "error"
          ? sanitizeSensitiveText(lastFailure?.message) ?? (!allRequiredPresent ? "Credenciais ausentes" : null)
          : status === "disconnected" && !allRequiredPresent
            ? "Credenciais ausentes"
            : null,
      environment: process.env.NODE_ENV ?? "development",
      latencyMs: lastEntry?.latencyMs ?? null,
      configuredFields,
      totalFields: getIntegrationFieldKeys(key).length,
      configuredCount: configuredFields.length,
      latestSync: googleStatus.latestSync,
    };
  }

  return {
    key,
    name: integrationLabels[key],
    status: derivedStatus,
    lastCheckedAt: lastEntry?.at ?? null,
    lastFailure: visibleFailure,
    environment: process.env.NODE_ENV ?? "development",
    latencyMs: lastEntry?.latencyMs ?? null,
    configuredFields,
    totalFields: getIntegrationFieldKeys(key).length,
    configuredCount: configuredFields.length,
    latestSync: null,
  };
}

router.get("/admin/metrics", async (_req, res, next) => {
  try {
    const data = await loadData();
    const users = mapUsers(data);
    const households = mapHouseholds(data);
    const conversations = mapConversations(data);
    const today = startOfDay();

    const growthSeries = Array.from({ length: 7 }).map((_, index) => {
      const day = addDays(today, index - 6);
      return {
        day: dayKey(day),
        users: data.users.filter((item) => dayKey(new Date(item.createdAt)) === dayKey(day)).length,
      };
    });
    const messagesPerDay = Array.from({ length: 7 }).map((_, index) => {
      const day = addDays(today, index - 6);
      return {
        day: dayKey(day),
        total: conversations.filter((item) => dayKey(new Date(item.createdAt)) === dayKey(day)).length,
      };
    });
    const aiCostPerDay = Array.from({ length: 7 }).map((_, index) => {
      const day = addDays(today, index - 6);
      const rows = conversations.filter((item) => dayKey(new Date(item.createdAt)) === dayKey(day));
      return {
        day: dayKey(day),
        total: Number(rows.reduce((sum, item) => sum + (item.engine === "ai" ? 0.003 : 0.0005), 0).toFixed(2)),
      };
    });

    res.json({
      totalUsers: data.users.length,
      totalHouseholds: data.households.length,
      individualHouseholds: households.filter((item) => item.type === "individual").length,
      sharedHouseholds: households.filter((item) => item.type === "shared").length,
      activeSubscriptions: data.subscriptions.filter((item) => normalizeStatus(item.status) === "active").length,
      expiredSubscriptions: data.subscriptions.filter((item) => normalizeStatus(item.status) === "expired").length,
      messagesToday: conversations.filter((item) => +new Date(item.createdAt) >= +today).length,
      totalTransactions: data.transactions.length,
      totalCommitments: data.commitments.length,
      estimatedAiCostToday: Number(
        conversations
          .filter((item) => +new Date(item.createdAt) >= +today)
          .reduce((sum, item) => sum + (item.engine === "ai" ? 0.003 : 0.0005), 0)
          .toFixed(2),
      ),
      integrationFailures: Number(!process.env.META_ACCESS_TOKEN) + Number(!process.env.OPENAI_API_KEY),
      pendingOpen: data.pendings.length,
      growthSeries,
      messagesPerDay,
      aiCostPerDay,
      latestEvents: conversations.slice(0, 6).map((item) => ({
        id: item.id,
        label: `${item.userName} • ${item.intent}`,
        createdAt: item.createdAt,
      })),
      alerts: [
        ...(data.pendings.length ? [{ type: "info", message: `${data.pendings.length} pendÃªncias abertas.` }] : []),
        ...(!process.env.META_ACCESS_TOKEN ? [{ type: "error", message: "WhatsApp desconectado." }] : []),
      ],
      planName: PLAN_NAME,
      monthlyPlanPrice: PLAN_MONTHLY_AMOUNT,
      annualPlanPrice: PLAN_ANNUAL_AMOUNT,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/admin/users", async (req, res, next) => {
  try {
    let rows = mapUsers(await loadData());
    const search = String(req.query.search ?? "").trim().toLowerCase();
    const status = String(req.query.status ?? "").trim().toLowerCase();
    const householdType = String(req.query.householdType ?? "").trim().toLowerCase();
    const role = String(req.query.role ?? "").trim().toLowerCase();
    if (search) rows = rows.filter((item) => item.name.toLowerCase().includes(search) || item.phone.includes(search) || (item.email ?? "").toLowerCase().includes(search));
    if (status) rows = rows.filter((item) => item.status === status);
    if (householdType) rows = rows.filter((item) => item.householdType === householdType);
    if (role) rows = rows.filter((item) => item.role === role);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.post("/admin/users", async (req, res, next) => {
  try {
    const name = String(req.body.name ?? "").trim();
    const email = String(req.body.email ?? "").trim().toLowerCase() || null;
    const rawPhone = String(req.body.phone ?? "").trim();
    const phone = normalizeBrazilPhone(rawPhone);
    const password = String(req.body.password ?? "");
    const role = String(req.body.role ?? "owner").trim().toLowerCase();
    const displayName = String(req.body.displayName ?? name).trim() || name;
    const householdName = String(req.body.householdName ?? `Conta ${name}`).trim() || `Conta ${name}`;
    const householdType = String(req.body.householdType ?? "individual").trim().toLowerCase();
    const planType = normalizePlanType(String(req.body.planType ?? "annual"));
    const existingHouseholdId = Number(req.body.householdId ?? 0) || null;

    if (!name || !phone || !password) {
      res.status(400).json({ message: "Nome, telefone e senha sao obrigatorios." });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ message: "A senha precisa ter pelo menos 6 caracteres." });
      return;
    }

    const allUsers = await db.select().from(usersTable);
    if (allUsers.some((item) => normalizeBrazilPhone(item.phone) === phone)) {
      res.status(409).json({ message: "Esse telefone ja esta em uso." });
      return;
    }
    if (email && allUsers.some((item) => (item.email ?? "").trim().toLowerCase() === email)) {
      res.status(409).json({ message: "Esse e-mail ja esta em uso." });
      return;
    }

    if (role === "partner") {
      if (!existingHouseholdId) {
        res.status(400).json({ message: "Informe a conta para adicionar o parceiro." });
        return;
      }

      const [household] = await db
        .select()
        .from(householdsTable)
        .where(eq(householdsTable.id, existingHouseholdId))
        .limit(1);

      if (!household) {
        res.status(404).json({ message: "Conta não encontrada." });
        return;
      }

      const members = await db
        .select()
        .from(householdMembersTable)
        .where(eq(householdMembersTable.householdId, existingHouseholdId));

      if (members.length >= MEMBER_LIMIT) {
        res.status(409).json({ message: "Essa conta ja atingiu o limite de 2 membros." });
        return;
      }

      const [partnerUser] = await db
        .insert(usersTable)
        .values({
          householdId: existingHouseholdId,
          name,
          phone,
          email,
          passwordHash: hashPassword(password),
          timezone: "America/Sao_Paulo",
          role: "partner",
          planType,
          billingStatus: household.billingStatus,
        })
        .returning();

      const [member] = await db
        .insert(householdMembersTable)
        .values({
          householdId: existingHouseholdId,
          userId: partnerUser.id,
          displayName,
          memberType: "partner",
        })
        .returning();

      await queueNotificationEvent({
        template: "welcome",
        user: partnerUser,
        payload: {
          memberType: "partner",
          displayName: member.displayName,
        },
      });

      res.status(201).json({ ok: true, user: partnerUser, member });
      return;
    }

    const [household] = await db
      .insert(householdsTable)
      .values({
        name: householdName,
        type: householdType === "shared" ? "couple" : "individual",
        planType,
        billingStatus: "active",
      })
      .returning();

    const [ownerUser] = await db
      .insert(usersTable)
      .values({
        householdId: household.id,
        name,
        phone,
        email,
        passwordHash: hashPassword(password),
        timezone: "America/Sao_Paulo",
        role: "owner",
        planType,
        billingStatus: "active",
      })
      .returning();

    const [member] = await db
      .insert(householdMembersTable)
      .values({
        householdId: household.id,
        userId: ownerUser.id,
        displayName,
        memberType: "owner",
      })
      .returning();

    await db
      .update(householdsTable)
      .set({ ownerUserId: ownerUser.id })
      .where(eq(householdsTable.id, household.id));

    const [subscription] = await db
      .insert(subscriptionsTable)
      .values({
        householdId: household.id,
        planName: PLAN_NAME,
        paymentMethod: "manual",
        amount: String(planAmount(planType).toFixed(2)),
        status: "active",
        startedAt: new Date(),
        endsAt: planEndsAt(planType),
      })
      .returning();

    await queueNotificationEvent({
      template: "welcome",
      user: ownerUser,
      payload: {
        householdName: household.name,
        subscriptionStatus: subscription.status,
      },
    });

    res.status(201).json({ ok: true, user: ownerUser, member, household, subscription });
  } catch (error) {
    next(error);
  }
});

router.get("/admin/users/:id", async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    const data = await loadData();
    const user = mapUsers(data).find((item) => item.id === userId);
    if (!user) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    const member = data.members.find((item) => item.userId === userId);
    const tx = data.transactions.filter((item) => item.createdBy === user.name || (member ? item.memberId === member.id : false));
    const commitments = data.commitments.filter((item) => (member ? item.memberId === member.id : false));
    const logs = mapConversations(data).filter((item) => item.userName === user.name);
    const householdSubscription = data.subscriptions.find((item) => item.householdId === user.householdId) ?? null;
    const householdPlanType = data.households.find((item) => item.id === user.householdId)?.planType ?? "annual";
    return res.json({
      profile: user,
      household: mapHouseholds(data).find((item) => item.id === user.householdId) ?? null,
      subscription: {
        planName: PLAN_NAME,
        cycle: normalizePlanType(householdPlanType),
        amount: householdSubscription ? toAmountNumber(householdSubscription.amount) : planAmount(householdPlanType),
        status: user.status,
        startedAt: user.subscriptionStartedAt,
        renewalDate: user.subscriptionEndsAt,
      },
      activity: { lastInteractionAt: user.lastActivityAt, totalMessages: user.messagesCount, totalTransactions: user.transactionsCount, totalCommitments: user.commitmentsCount, aiUsage: logs.filter((item) => item.engine === "ai").length },
      financial: {
        latestExpenses: tx.filter((item) => item.type === "expense").slice(0, 5).map((item) => ({ ...item, amount: toAmountNumber(item.amount) })),
        latestIncomes: tx.filter((item) => item.type === "income").slice(0, 5).map((item) => ({ ...item, amount: toAmountNumber(item.amount) })),
      },
      agenda: { upcomingCommitments: commitments.filter((item) => +new Date(item.commitmentDate) >= Date.now()).slice(0, 5) },
      logs: { latestMessages: logs.slice(0, 10), recentErrors: data.pendings.filter((item) => item.userId === userId).slice(0, 10) },
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/admin/users/:id/actions", async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    const action = String(req.body.action ?? "");
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    if (action === "suspend") {
      await db.update(usersTable).set({ billingStatus: "suspended" }).where(eq(usersTable.id, userId));
      await queueNotificationEvent({
        template: "payment_overdue",
        user,
      });
    }
    if (action === "reactivate" || action === "mark_active") await db.update(usersTable).set({ billingStatus: "active" }).where(eq(usersTable.id, userId));
    if (action === "remove_from_household") {
      const [member] = await db.select().from(householdMembersTable).where(eq(householdMembersTable.userId, userId)).limit(1);
      if (member?.memberType !== "owner") {
        if (member) await db.delete(householdMembersTable).where(eq(householdMembersTable.id, member.id));
        await db.update(usersTable).set({ householdId: null }).where(eq(usersTable.id, userId));
      }
    }
    if (action === "delete") {
      // Remove de household_members primeiro (FK)
      await db.delete(householdMembersTable).where(eq(householdMembersTable.userId, userId));
      // Remove usuário de fato
      await db.delete(usersTable).where(eq(usersTable.id, userId));
    }
    return res.json({ ok: true, action, planName: PLAN_NAME });
  } catch (error) {
    return next(error);
  }
});

router.post("/admin/danger/wipe-database", async (_req, res, next) => {
  try {
    // Apenas admin (já protegido pelo middleware global se houver, mas garantindo aqui)
    // O requireAdmin já deve estar sendo usado no router ou app
    
    logger.info("WIPE DATABASE initiated by admin");
    
    // TRUNCATE com CASCADE limpa todas as tabelas vinculadas (transações, logs, etc.)
    await db.execute(sql`TRUNCATE households, users RESTART IDENTITY CASCADE;`);
    
    // Recria o admin mestre imediatamente para não perder o acesso
    await ensurePermanentAdminUser();
    await ensureDefaultReferralCampaign();
    
    return res.json({ ok: true, message: "Banco de dados zerado com sucesso. Admin recriado." });
  } catch (error) {
    return next(error);
  }
});

router.get("/admin/households", async (_req, res, next) => {
  try {
    res.json(mapHouseholds(await loadData()));
  } catch (error) {
    next(error);
  }
});

router.get("/admin/households/:id", async (req, res, next) => {
  try {
    const householdId = Number(req.params.id);
    const data = await loadData();
    const household = mapHouseholds(data).find((item) => item.id === householdId);
    if (!household) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    const members = mapUsers(data).filter((item) => item.householdId === householdId);
    const transactions = data.transactions.filter((item) => item.householdId === householdId).slice(0, 10);
    const commitments = data.commitments.filter((item) => item.householdId === householdId).slice(0, 10);
    const bills = data.bills.filter((item) => item.householdId === householdId).slice(0, 10);
    const logs = mapConversations(data).filter((item) => item.householdName === household.name).slice(0, 10);
    return res.json({
      household,
      members,
      subscription: mapSubscriptions(data).find((item) => item.householdId === householdId) ?? null,
      financial: {
        latestTransactions: transactions.map((item) => ({ ...item, amount: toAmountNumber(item.amount) })),
        spendingByMember: members.map((member) => ({
          name: member.name,
          total: transactions.filter((item) => item.createdBy === member.name).reduce((sum, item) => sum + toAmountNumber(item.amount), 0),
        })),
      },
      agenda: { commitments },
      bills,
      logs,
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/admin/households/:id/actions", async (req, res, next) => {
  try {
    const householdId = Number(req.params.id);
    const action = String(req.body.action ?? "");
    if (action === "deactivate") {
      await db.update(householdsTable).set({ billingStatus: "suspended" }).where(eq(householdsTable.id, householdId));
      const members = await db.select().from(householdMembersTable).where(eq(householdMembersTable.householdId, householdId));
      const ownerMember = members.find((item) => item.memberType === "owner") ?? members[0] ?? null;
      const [ownerUser] = ownerMember
        ? await db.select().from(usersTable).where(eq(usersTable.id, ownerMember.userId)).limit(1)
        : [null];
      if (ownerUser) {
        await queueNotificationEvent({
          template: "payment_overdue",
          user: ownerUser,
        });
      }
    }
    if (action === "reactivate") await db.update(householdsTable).set({ billingStatus: "active" }).where(eq(householdsTable.id, householdId));
    if (action === "remove_partner") {
      const members = await db.select().from(householdMembersTable).where(eq(householdMembersTable.householdId, householdId));
      const partner = members.find((item) => item.memberType !== "owner");
      if (partner) {
        await db.delete(householdMembersTable).where(eq(householdMembersTable.id, partner.id));
        await db.update(usersTable).set({ householdId: null }).where(eq(usersTable.id, partner.userId));
      }
    }
    res.json({ ok: true, action });
  } catch (error) {
    next(error);
  }
});

router.get("/admin/subscriptions", async (req, res, next) => {
  try {
    let rows = mapSubscriptions(await loadData());
    const status = String(req.query.status ?? "").trim().toLowerCase();
    if (status) rows = rows.filter((item) => item.status === status);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get("/admin/subscriptions/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const data = await loadData();
    const subscription = mapSubscriptions(data).find((item) => item.id === id);
    if (!subscription) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    return res.json({
      subscription,
      household: mapHouseholds(data).find((item) => item.id === subscription.householdId) ?? null,
      members: mapUsers(data).filter((item) => item.householdId === subscription.householdId),
      statusHistory: [
        { status: subscription.status, at: subscription.startedAt, note: "Status atual" },
        { status: "active", at: subscription.startedAt, note: "Assinatura iniciada" },
      ],
      billingEvents: [
        { type: "payment_confirmed", at: subscription.startedAt, source: subscription.paymentMethod },
        { type: "renewal_scheduled", at: subscription.renewalDate, source: "system" },
      ],
      notes: "Plano Contai com duas formas de cobrança: mensal ou anual, sempre com os mesmos recursos.",
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/admin/subscriptions/:id/actions", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const action = String(req.body.action ?? "");
    const [subscription] = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.id, id))
      .limit(1);

    if (!subscription) {
      res.status(404).json({ message: "Assinatura não encontrada." });
      return;
    }

    const householdMembers = await db
      .select()
      .from(householdMembersTable)
      .where(eq(householdMembersTable.householdId, subscription.householdId));
    const ownerMember = householdMembers.find((item) => item.memberType === "owner") ?? householdMembers[0] ?? null;
    const [ownerUser] = ownerMember
      ? await db.select().from(usersTable).where(eq(usersTable.id, ownerMember.userId)).limit(1)
      : [null];
    const [household] = await db
      .select()
      .from(householdsTable)
      .where(eq(householdsTable.id, subscription.householdId))
      .limit(1);
    const memberUserIds = householdMembers.map((item) => item.userId);
    const currentCycle = household?.planType ?? subscription.cycle;

    if (action === "activate" || action === "reactivate" || action === "mark_paid") {
      await db
        .update(subscriptionsTable)
        .set({
          status: "active",
          startedAt: new Date(),
          endsAt: planEndsAt(currentCycle, new Date()),
        })
        .where(eq(subscriptionsTable.id, id));
      await db
        .update(householdsTable)
        .set({
          billingStatus: "active",
          updatedAt: new Date(),
        })
        .where(eq(householdsTable.id, subscription.householdId));
      if (memberUserIds.length) {
        await db
          .update(usersTable)
          .set({
            billingStatus: "active",
            planType: currentCycle,
            updatedAt: new Date(),
          })
          .where(inArray(usersTable.id, memberUserIds));
      }
      if (ownerUser) {
        await queueNotificationEvent({
          template: "payment_confirmed",
          user: ownerUser,
          payload: {
            subscriptionId: id,
            paymentMethod: subscription.paymentMethod,
            cycle: currentCycle,
            amount: subscription.amount,
          },
        });
      }
      await markReferralPaidFromHousehold(subscription.householdId);
    }
    if (action === "suspend") {
      await db.update(subscriptionsTable).set({ status: "suspended" }).where(eq(subscriptionsTable.id, id));
      await db
        .update(householdsTable)
        .set({
          billingStatus: "suspended",
          updatedAt: new Date(),
        })
        .where(eq(householdsTable.id, subscription.householdId));
      if (memberUserIds.length) {
        await db
          .update(usersTable)
          .set({
            billingStatus: "suspended",
            updatedAt: new Date(),
          })
          .where(inArray(usersTable.id, memberUserIds));
      }
      if (ownerUser) {
        await queueNotificationEvent({
          template: "payment_overdue",
          user: ownerUser,
          payload: {
            subscriptionId: id,
            renewalDate: subscription.endsAt,
          },
        });
      }
    }
    if (action === "update_renewal") {
      await db
        .update(subscriptionsTable)
        .set({
          endsAt: planEndsAt(
            (await db.select().from(householdsTable).where(eq(householdsTable.id, subscription.householdId)).limit(1))[0]?.planType,
            new Date(),
          ),
        })
        .where(eq(subscriptionsTable.id, id));
    }
    res.json({ ok: true, action, planName: PLAN_NAME });
  } catch (error) {
    next(error);
  }
});

router.get("/admin/conversations", async (req, res, next) => {
  try {
    let rows = mapConversations(await loadData());
    const user = String(req.query.user ?? "").trim().toLowerCase();
    const household = String(req.query.household ?? "").trim().toLowerCase();
    const intent = String(req.query.intent ?? "").trim().toLowerCase();
    const sourceType = String(req.query.sourceType ?? "").trim().toLowerCase();
    const error = String(req.query.error ?? "").trim().toLowerCase();
    if (user) rows = rows.filter((item) => item.userName.toLowerCase().includes(user));
    if (household) rows = rows.filter((item) => item.householdName.toLowerCase().includes(household));
    if (intent) rows = rows.filter((item) => item.intent.toLowerCase().includes(intent));
    if (sourceType) rows = rows.filter((item) => item.sourceType === sourceType);
    if (error === "true") rows = rows.filter((item) => Boolean(item.error));
    res.json(rows);
  } catch (errorValue) {
    next(errorValue);
  }
});

router.get("/admin/conversations/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const conversation = mapConversations(await loadData()).find((item) => item.id === id);
    if (!conversation) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    return res.json({
      ...conversation,
      rawMessage: conversation.originalContent,
      decision: conversation.intent,
      responseSent: conversation.direction === "outbound" ? conversation.content : null,
      trace: [
        { step: "received", detail: "Mensagem recebida no webhook" },
        { step: conversation.engine, detail: conversation.engine === "ai" ? "Processada com IA" : "Processada por regra" },
        { step: "stored", detail: "Log salvo no banco" },
      ],
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/admin/conversations/:id/actions", (req, res) => {
  res.json({ ok: true, action: String(req.body.action ?? "") });
});

router.get("/admin/processings", async (req, res, next) => {
  try {
    const data = await loadData();
    const pending = data.pendings.map((item) => ({
      id: item.id,
      userName: data.users.find((user) => user.id === item.userId)?.name ?? "Sem usuÃ¡rio",
      householdName: data.households.find((household) => household.id === item.householdId)?.name ?? "Sem conta",
      type: item.kind,
      reason: item.question,
      originalMessage: JSON.stringify(item.payload),
      status: "pending",
      createdAt: item.createdAt,
      conversationId: null,
    }));
    const derived = mapConversations(data)
      .filter((item) => item.sourceType !== "text")
      .map((item) => ({
        id: item.id + 100000,
        userName: item.userName,
        householdName: item.householdName,
        type: item.sourceType,
        reason: item.error ?? (item.intent === "indefinido" ? "Falha de interpretaÃ§Ã£o" : "Processado"),
        originalMessage: item.originalContent,
        status: item.error ? "failed" : "processed",
        createdAt: item.createdAt,
        conversationId: item.id,
      }));
    let items = [...pending, ...derived].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    const type = String(req.query.type ?? "").trim().toLowerCase();
    const status = String(req.query.status ?? "").trim().toLowerCase();
    if (type) items = items.filter((item) => item.type.toLowerCase().includes(type));
    if (status) items = items.filter((item) => item.status === status);
    res.json({
      metrics: {
        textProcessed: data.logs.filter((item) => item.sourceType === "text").length,
        audioProcessed: data.logs.filter((item) => item.sourceType === "audio").length,
        imageProcessed: data.logs.filter((item) => item.sourceType === "image").length,
        pendingOpen: pending.length,
        transcriptionFailures: items.filter((item) => item.type === "audio" && item.status !== "processed").length,
        visionFailures: items.filter((item) => item.type === "image" && item.status !== "processed").length,
        interpretationFailures: items.filter((item) => item.reason.toLowerCase().includes("interpretaÃ§Ã£o")).length,
        reprocessings: derived.length,
      },
      items,
      latestErrors: items.filter((item) => item.status !== "processed").slice(0, 10),
      awaitingComplement: items.filter((item) => item.status === "pending").slice(0, 10),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/admin/processings/:id/actions", (req, res) => {
  res.json({ ok: true, action: String(req.body.action ?? "") });
});

router.get("/admin/integrations", async (_req, res, next) => {
  try {
    const rows = await Promise.all(
      (["whatsapp", "openai", "gemini", "google-calendar", "cakto", "utmify", "email", "supabase"] as IntegrationKey[]).map((key) =>
        buildIntegrationSummary(key),
      ),
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get("/admin/integrations/:key", async (req, res, next) => {
  try {
    const key = normalizeIntegrationKey(req.params.key);
    if (!key) {
      res.status(404).json({ message: "Integração não encontrada." });
      return;
    }

    const values = await getIntegrationStoredValues(key);
    const history = await getIntegrationHistory(key);
    const summary = await buildIntegrationSummary(key);
    const safeHistory = history.map((item) => ({
      ...item,
      message: sanitizeSensitiveText(item.message) ?? item.message,
      response: sanitizeSensitiveText(item.response) ?? item.response,
    }));

    res.json({
      key,
      name: integrationLabels[key],
      status: summary.status,
      lastCheckedAt: summary.lastCheckedAt,
      lastFailure: summary.lastFailure,
      lastResponse: safeHistory[0]?.response ?? safeHistory[0]?.message ?? null,
      latestSync: summary.latestSync,
      history: safeHistory,
      hints: buildIntegrationHints(key),
      fields: integrationFields[key].map((field) => ({
        ...field,
        value: values[field.key] ?? "",
        valueMasked: field.secret ? maskSecretValue(values[field.key] ?? "") : values[field.key] ?? "",
        configured: Boolean(values[field.key]?.trim()),
      })),
      configuredCount: summary.configuredCount,
      totalFields: summary.totalFields,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/admin/integrations/:key/settings", async (req, res, next) => {
  try {
    const key = normalizeIntegrationKey(req.params.key);
    if (!key) {
      res.status(404).json({ message: "Integração não encontrada." });
      return;
    }

    const bodyValues = parseJsonBody<Record<string, unknown>>(req.body.values) ?? parseJsonBody<Record<string, unknown>>(req.body) ?? {};
    const payload = integrationFields[key].reduce<Record<string, string>>((acc, field) => {
      acc[field.key] = normalizeIntegrationFieldValue(field.key, bodyValues[field.key]);
      return acc;
    }, {});

    await saveIntegrationStoredValues(key, payload);
    await appendIntegrationHistory(key, {
      status: "disconnected",
      message: INTEGRATION_SETTINGS_PENDING_MESSAGE,
      at: new Date().toISOString(),
      latencyMs: null,
      response: null,
    });

    res.json({ ok: true, message: "Chaves salvas com sucesso." });
  } catch (error) {
    next(error);
  }
});

router.post("/admin/integrations/test", async (req, res, next) => {
  try {
    const key = normalizeIntegrationKey(String(req.body.service ?? ""));
    if (!key) {
      res.status(400).json({ message: "Serviço inválido para teste." });
      return;
    }

    const result = await runIntegrationTest(key);
    await appendIntegrationHistory(key, {
      status: result.status,
      message: result.message,
      at: new Date().toISOString(),
      latencyMs: result.latencyMs,
      response: result.response,
    });

    res.json({
      service: key,
      status: result.status,
      checkedAt: new Date().toISOString(),
      latencyMs: result.latencyMs,
      message: result.message,
      latestSync: result.latestSync,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/admin/system-settings", async (_req, res, next) => {
  try {
    res.json(await getSystemSettings());
  } catch (error) {
    next(error);
  }
});

router.get("/admin/bot/prompt-preview", (_req, res) => {
  res.json(getBotPromptPreview());
});

router.post("/admin/bot/test-message", async (req, res, next) => {
  try {
    const session = getSession(req);
    if (!session?.userId) {
      res.status(401).json({ message: "Sessao administrativa invalida para testar o bot." });
      return;
    }

    const message = String(req.body.message ?? "").trim();
    const rawScenario = String(req.body.scenario ?? "active").trim();
    const scenario: BotPreviewScenario =
      rawScenario === "unregistered" ||
      rawScenario === "inactive_plan" ||
      rawScenario === "google_required"
        ? rawScenario
        : "active";

    if (!message) {
      res.status(400).json({ message: "Digite uma mensagem para testar o bot." });
      return;
    }

    const result = await previewBotMessage({
      userId: session.userId,
      message,
      scenario,
      messageType: "text",
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/admin/system-settings", async (req, res, next) => {
  try {
    res.json({ ok: true, settings: await updateSystemSettings(req.body ?? {}) });
  } catch (error) {
    next(error);
  }
});

router.get("/admin/costs", async (_req, res, next) => {
  try {
    const data = await loadData();
    const conversations = mapConversations(data);
    const households = mapHouseholds(data);
    const today = startOfDay();
    const series = Array.from({ length: 7 }).map((_, index) => {
      const day = addDays(today, index - 6);
      const rows = conversations.filter((item) => dayKey(new Date(item.createdAt)) === dayKey(day));
      return {
        day: dayKey(day),
        total: Number(rows.reduce((sum, item) => sum + (item.engine === "ai" ? 0.0025 : 0.0004), 0).toFixed(2)),
        openai: Number(rows.filter((item) => item.engine === "ai").reduce((sum) => sum + 0.0025, 0).toFixed(2)),
        gemini: Number(rows.filter((item) => item.sourceType !== "text").reduce((sum) => sum + 0.003, 0).toFixed(2)),
      };
    });
    const byUser = mapUsers(data).map((item) => ({ userId: item.id, name: item.name, estimatedCost: Number((item.messagesCount * 0.0016).toFixed(2)) }));
    const byHousehold = households.map((item) => ({ householdId: item.id, householdName: item.name, estimatedCost: Number((conversations.filter((row) => row.householdName === item.name).length * 0.0017).toFixed(2)) }));
    res.json({
      openAiToday: Number(conversations.filter((item) => +new Date(item.createdAt) >= +today && item.engine === "ai").reduce((sum) => sum + 0.0025, 0).toFixed(2)),
      geminiToday: Number(conversations.filter((item) => +new Date(item.createdAt) >= +today && item.sourceType !== "text").reduce((sum) => sum + 0.003, 0).toFixed(2)),
      totalToday: Number(conversations.filter((item) => +new Date(item.createdAt) >= +today).reduce((sum, item) => sum + (item.engine === "ai" ? 0.0025 : 0.0004), 0).toFixed(2)),
      byUser,
      byHousehold,
      byProcessingType: {
        text: conversations.filter((item) => item.sourceType === "text").length,
        audio: conversations.filter((item) => item.sourceType === "audio").length,
        image: conversations.filter((item) => item.sourceType === "image").length,
      },
      averages: {
        costPerUser: Number((byUser.reduce((sum, item) => sum + item.estimatedCost, 0) / Math.max(byUser.length, 1)).toFixed(2)),
        costPerHousehold: Number((byHousehold.reduce((sum, item) => sum + item.estimatedCost, 0) / Math.max(byHousehold.length, 1)).toFixed(2)),
      },
      series,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

