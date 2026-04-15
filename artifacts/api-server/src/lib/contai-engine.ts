import {
  accountsTable,
  aiLogsTable,
  billsTable,
  categoriesTable,
  commitmentsTable,
  conversationLogsTable,
  db,
  googleCalendarConnectionsTable,
  householdMembersTable,
  householdsTable,
  pendingDecisionsTable,
  projectsTable,
  remindersTable,
  subscriptionsTable,
  toAmountNumber,
  transactionsTable,
  usersTable,
} from "@workspace/db";
import { and, asc, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { interpretTextWithOpenAI, rewriteReplyWithOpenAI, generateFinancialInsights, answerFAQWithOpenAI, type AIParsedMessage } from "./openai-client";
import {
  getGoogleCalendarStatus,
  syncBillForUser,
  syncCommitmentForUser,
  syncReminderForUser,
} from "./google-calendar";
import { queueNotificationEvent } from "./notifications";
import { logger } from "./logger";
import { expandBrazilPhoneVariants, normalizeBrazilPhone } from "./phone";
import { markReferralActiveFromRealUse } from "./referrals";
import { systemSettings } from "./system-settings";
import { toZonedTime, fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { startOfDay as fnsStartOfDay, endOfDay as fnsEndOfDay, startOfMonth as fnsStartOfMonth, endOfMonth as fnsEndOfMonth, addDays, getDay } from "date-fns";

/** 
 * V5: Observabilidade de IA 
 */
async function logAiAction(params: {
  userId?: number;
  householdId: number;
  model: string;
  input: string;
  output?: string;
  tokens?: number;
  promptVersion?: string;
}) {
  try {
    await db.insert(aiLogsTable).values({
      userId: params.userId ?? null,
      householdId: params.householdId,
      modelUsed: params.model,
      input: params.input,
      output: params.output ?? null,
      tokens: params.tokens ?? null,
      promptVersion: params.promptVersion ?? "v5-std",
    });
  } catch (err) {
    logger.error("Falha ao salvar log de IA:", err as any);
  }
}

/**
 * V5: Provisionamento de Contas Padrão
 */
async function ensureDefaultAccounts(householdId: number, userId?: number) {
  const existing = await db.select().from(accountsTable).where(eq(accountsTable.householdId, householdId));
  
  if (existing.length === 0) {
    await db.insert(accountsTable).values([
      { householdId, name: "Conta Corrente", type: "checking", isActive: true },
      { householdId, name: "Cartão de Crédito", type: "credit", isActive: true },
      { householdId, name: "Dinheiro (Caixa)", type: "cash", isActive: true },
    ]);
    return await db.select().from(accountsTable).where(eq(accountsTable.householdId, householdId));
  }
  return existing;
}

/**
 * V5: Localização Inteligente de Conta
 */
async function findAccount(householdId: number, name?: string | null, typeHint: string = "checking") {
  const accounts = await db.select().from(accountsTable).where(eq(accountsTable.householdId, householdId));
  
  if (!name) {
    return accounts.find(a => a.type === typeHint) || accounts[0];
  }

  const normalized = name.toLowerCase();
  const match = accounts.find(a => a.name.toLowerCase().includes(normalized) || normalized.includes(a.name.toLowerCase()));
  
  return match || accounts.find(a => a.type === typeHint) || accounts[0];
}

type MessageKind = "text" | "audio" | "image";
type Visibility = "shared" | "personal";
type ParsedIntent =
  | "registrar_gasto"
  | "registrar_receita"
  | "registrar_conta"
  | "registrar_compromisso"
  | "registrar_lembrete"
  | "consulta_resumo"
  | "consulta_histórico"
  | "consulta_categoria"
  | "saudacao"
  | "ajuda"
  | "reset_dados"
  | "registrar_meta"
  | "analise_financeira"
  | "registrar_pagamento_fatura"
  | "analise_financeira_proativa"
  | "cancelar_lancamento"
  | "indefinido";

type ProcessIncomingMessageInput = {
  phone: string;
  content: string;
  source?: string;
  messageType?: MessageKind;
  userName?: string;
  extractions?: Array<{
    normalizedText: string;
    extracted: any;
  }>;
};

type ParsedMessage = {
  intent: ParsedIntent;
  amount?: number;
  category?: string;
  description?: string;
  title?: string;
  when?: Date;
  recurrence?: string | null;
  notes?: string | null;
  visibility?: Visibility;
  accountType?: "house" | "personal";
  conta?: string;
  contaDestino?: string;
  paymentMethod?: "debito" | "credito" | "pix" | "dinheiro" | "boleto";
  installments?: number;
  contextUncertain?: boolean | null;
  projeto?: string | null;
  projectId?: number | null;
};

type PendingKind = "registrar_gasto" | "registrar_conta" | "registrar_compromisso" | "missing_info";
type PendingPayload = {
  parsed: ParsedMessage;
  originalContent: string;
  source?: string;
  messageType?: MessageKind;
};
type Identity = NonNullable<Awaited<ReturnType<typeof getIdentityByPhone>>>;
type BotAccessResult =
  | { ok: true; identity: Identity }
  | { ok: false; reply: string; intent: ParsedIntent; identity?: Identity };
type SaveParsedActionOptions = {
  previewOnly?: boolean;
  forceGoogleAgendaBlocked?: boolean;
};
export type BotPreviewScenario = "active" | "unregistered" | "inactive_plan" | "google_required";

export const BOT_PHONE = "556195010700";

const DEFAULT_SOURCE = "whatsapp";
const CATEGORY_MAP: Array<{ category: string; words: string[] }> = [
  { category: "Mercado", words: ["mercado", "supermercado"] },
  { category: "Alimentação", words: ["ifood", "restaurante", "lanche", "padaria", "comida"] },
  { category: "Combustível", words: ["posto", "gasolina", "combustivel"] },
  { category: "Oficina", words: ["mecanico", "mecânico", "oficina", "conserto", "manutencao", "manutenção"] },
  { category: "Transporte", words: ["uber", "onibus", "ônibus"] },
  { category: "Internet", words: ["internet"] },
  { category: "Aluguel", words: ["aluguel"] },
  { category: "Farmácia", words: ["farmacia", "remedio", "remédio"] },
  { category: "Saúde", words: ["consulta", "exame", "dentista"] },
  { category: "Lazer", words: ["cinema", "bar", "show", "streaming"] },
  { category: "Salário", words: ["salario", "empresa", "holerite"] },
  { category: "Freela", words: ["freela", "freelance", "cliente", "projeto"] },
];

const WEEKDAY_MAP: Record<string, number> = {
  domingo: 0,
  segunda: 1,
  "segunda-feira": 1,
  terca: 2,
  "terça": 2,
  "terça-feira": 2,
  quarta: 3,
  "quarta-feira": 3,
  quinta: 4,
  "quinta-feira": 4,
  sexta: 5,
  sabado: 6,
  sábado: 6,
};

export function startOfMonth(date = new Date(), tz = "America/Sao_Paulo") {
  const zoned = toZonedTime(date, tz);
  return fromZonedTime(fnsStartOfMonth(zoned), tz);
}

export function endOfMonth(date = new Date(), tz = "America/Sao_Paulo") {
  const zoned = toZonedTime(date, tz);
  return fromZonedTime(fnsEndOfMonth(zoned), tz);
}

export function startOfDay(date = new Date(), tz = "America/Sao_Paulo") {
  const zoned = toZonedTime(date, tz);
  return fromZonedTime(fnsStartOfDay(zoned), tz);
}

export function endOfDay(date = new Date(), tz = "America/Sao_Paulo") {
  const zoned = toZonedTime(date, tz);
  return fromZonedTime(fnsEndOfDay(zoned), tz);
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function parseAmount(text: string) {
  const match = text.match(/(\d{1,3}(?:[.\s]\d{3})*(?:,\d{1,2})|\d+(?:,\d{1,2})?)/);
  if (!match) return undefined;
  return Number(match[1].replace(/\./g, "").replace(",", "."));
}

function inferCategory(text: string, fallbackType: "expense" | "income") {
  const normalized = normalizeText(text);
  for (const entry of CATEGORY_MAP) {
    if (entry.words.some((word) => normalized.includes(word))) {
      return entry.category;
    }
  }
  return fallbackType === "income" ? "Freela" : "Outros";
}

function detectAccountType(text: string): "personal" | "house" | undefined {
  const normalized = normalizeText(text);
  if (
    normalized.includes("da casa") ||
    normalized.includes("de casa") ||
    normalized.includes("compartilhado") ||
    normalized.includes("compartilhada") ||
    normalized.includes("nosso") ||
    normalized.includes("nossa")
  ) {
    return "house";
  }

  if (
    normalized.includes("so meu") ||
    normalized.includes("so minha") ||
    normalized.includes("só meu") ||
    normalized.includes("só minha") ||
    normalized === "meu" ||
    normalized === "minha" ||
    normalized.includes("pessoal") ||
    normalized.includes("individual")
  ) {
    return "personal";
  }

  return undefined;
}

function detectPaymentMethod(text: string): ParsedMessage["paymentMethod"] {
  const normalized = normalizeText(text);
  if (normalized.includes("pix")) return "pix";
  if (normalized.includes("credito") || normalized.includes("crédito")) return "credito";
  if (normalized.includes("debito") || normalized.includes("débito")) return "debito";
  if (normalized.includes("dinheiro")) return "dinheiro";
  if (normalized.includes("boleto")) return "boleto";
  return undefined;
}

function detectExplicitVisibility(text: string): Visibility | undefined {
  const type = detectAccountType(text);
  if (type === "house") return "shared";
  if (type === "personal") return "personal";
  return undefined;
}

function inferSharedByContext(parsed: ParsedMessage, text: string): Visibility | undefined {
  const normalized = normalizeText(text);

  if (parsed.intent === "registrar_compromisso") {
    if (
      normalized.includes("nosso") ||
      normalized.includes("nossa") ||
      normalized.includes("familia") ||
      normalized.includes("família") ||
      normalized.includes("casa")
    ) {
      return "shared";
    }
    return undefined;
  }

  if (
    parsed.category &&
    ["Mercado", "Aluguel", "Internet", "Contas", "Moradia", "Água", "Luz"].includes(
      parsed.category,
    )
  ) {
    return "shared";
  }

  if (
    normalized.includes("mercado") ||
    normalized.includes("aluguel") ||
    normalized.includes("internet") ||
    normalized.includes("conta de luz") ||
    normalized.includes("conta de agua") ||
    normalized.includes("conta de água")
  ) {
    return "shared";
  }

  return undefined;
}

function cleanDescription(text: string) {
  return text
    .replace(
      /^(gastei|paguei|comprei|recebi|ganhei|entrou|anota|registrar|registra|helen gastou|rafa gastou|camila gastou)\s+/i,
      "",
    )
    .replace(/(\d{1,3}(?:[.\s]\d{3})*(?:,\d{1,2})|\d+(?:,\d{1,2})?)/, "")
    .replace(/\b(reais|real|r\$)\b/gi, "")
    .replace(/\b(no|na|de|do|da|pro|pra)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseDateTime(text: string, nowParam = new Date(), tz = "America/Sao_Paulo") {
  const normalized = normalizeText(text);
  const hourMatch = normalized.match(/(\d{1,2})(?::(\d{2}))?\s*h?/);
  const hour = hourMatch ? Number(hourMatch[1]) : 9;
  const minute = hourMatch?.[2] ? Number(hourMatch[2]) : 0;

  const now = toZonedTime(nowParam, tz);

  if (normalized.includes("amanha")) {
    const tomorrow = addDays(now, 1);
    tomorrow.setHours(hour, minute, 0, 0);
    return fromZonedTime(tomorrow, tz);
  }

  if (normalized.includes("hoje")) {
    const today = new Date(now.getTime());
    today.setHours(hour, minute, 0, 0);
    return fromZonedTime(today, tz);
  }

  const weekdayEntry = Object.entries(WEEKDAY_MAP).find(([label]) =>
    normalized.includes(label),
  );
  if (weekdayEntry) {
    const date = new Date(now.getTime());
    const distance = (weekdayEntry[1] - getDay(date) + 7) % 7 || 7;
    const future = addDays(date, distance);
    future.setHours(hour, minute, 0, 0);
    return fromZonedTime(future, tz);
  }

  const dayOfMonthMatch = normalized.match(/\bdia\s+(\d{1,2})\b/);
  if (dayOfMonthMatch) {
    const date = new Date(now.getTime());
    const day = Number(dayOfMonthMatch[1]);
    if (day < date.getDate()) {
      date.setMonth(date.getMonth() + 1);
    }
    date.setDate(day);
    date.setHours(hour, minute, 0, 0);
    return fromZonedTime(date, tz);
  }

  return undefined;
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatFullDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getHelpText() {
  return (
    systemSettings.botHelpText?.trim() ||
    "Posso anotar gastos, receitas, contas e compromissos. Ex.: 'gastei 50 no mercado' ou 'consulta amanha as 14h'."
  );
}

function getAppBaseUrl() {
  return process.env.APP_BASE_URL?.trim() || "https://contai.site";
}

function capitalizeLabel(value: string | null | undefined) {
  const text = String(value ?? "").trim();
  if (!text) {
    return "";
  }

  return text.charAt(0).toUpperCase() + text.slice(1);
}

function getFirstName(name: string | null | undefined) {
  const text = String(name ?? "").trim();
  if (!text) {
    return "";
  }

  return text.split(/\s+/)[0] ?? "";
}

function resolveBotTemplateMessage(message: string, appBaseUrl: string) {
  return message.replace(/\{\{\s*appBaseUrl\s*\}\}/g, appBaseUrl);
}

function buildGoogleCalendarConnectionReply() {
  const appBaseUrl = getAppBaseUrl();
  const loginUrl = `${appBaseUrl}/login?next=${encodeURIComponent("/app/integracoes")}`;
  const integrationsUrl = `${appBaseUrl}/app/integracoes`;
  const customMessage = resolveBotTemplateMessage(
    systemSettings.botGoogleCalendarConnectionMessage?.trim() ||
      "Para agendar compromissos no Contai, conecte primeiro o seu Google Agenda.",
    appBaseUrl,
  );

  return [
    customMessage,
    "",
    "Como conectar:",
    "1. Abra o login do Contai.",
    "2. Entre na sua conta.",
    "3. Va em Integracoes.",
    "4. Toque em Conectar Google Agenda.",
    "",
    `Login direto: ${loginUrl}`,
    `Se ja estiver logado: ${integrationsUrl}`,
  ].join("\n");
}

function parseMessageByRules(content: string, tz = "America/Sao_Paulo"): ParsedMessage {
  const normalized = normalizeText(content);
  if (!normalized) return { intent: "indefinido" };

  if (["oi", "ola", "olá", "bom dia", "boa tarde", "boa noite"].includes(normalized)) {
    return { intent: "saudacao" };
  }

  if (normalized.includes("ajuda") || normalized.includes("como funciona")) {
    return { intent: "ajuda" };
  }

  if (normalized.includes("quanto nos gastamos") || normalized.includes("quanto gastamos")) {
    return { intent: "consulta_resumo", visibility: "shared" };
  }

  if (
    normalized.includes("quanto eu gastei") ||
    normalized.includes("quanto gastei sozinho") ||
    normalized.includes("quanto gastei esse mes")
  ) {
    return { intent: "consulta_resumo", visibility: "personal" };
  }

  if (
    normalized.includes("quanto gastei") ||
    normalized.includes("resumo") ||
    normalized.includes("saldo desse mes") ||
    normalized.includes("saldo do mes")
  ) {
    const hasCategoryHint = CATEGORY_MAP.some((entry) =>
      entry.words.some((word) => normalized.includes(word)),
    );
    return {
      intent: hasCategoryHint ? "consulta_categoria" : "consulta_resumo",
      category: hasCategoryHint ? inferCategory(normalized, "expense") : undefined,
    };
  }

  if (normalized.includes("histórico") || normalized.includes("ultimas movimentacoes")) {
    return { intent: "consulta_histórico" };
  }

  if (normalized.includes("me lembra") || normalized.includes("lembrar de")) {
    return {
      intent: "registrar_lembrete",
      title: content.replace(/me lembra de|lembrar de/gi, "").trim(),
      when: parseDateTime(content, undefined, tz),
      visibility: "personal",
    };
  }

  if (normalized.includes("conta") || normalized.includes("boleto") || normalized.includes("vence")) {
    return {
      intent: "registrar_conta",
      title: cleanDescription(content) || "Conta",
      amount: parseAmount(content),
      category: inferCategory(content, "expense"),
      when: parseDateTime(content, undefined, tz),
    };
  }

  if (
    normalized.includes("consulta") ||
    normalized.includes("reuniao") ||
    normalized.includes("reunião") ||
    normalized.includes("compromisso") ||
    normalized.includes("agende")
  ) {
    return {
      intent: "registrar_compromisso",
      title:
        content.replace(
          /\b(amanha|hoje|segunda|terça|terca|quarta|quinta|sexta|sabado|sábado|domingo)\b.*$/i,
          "",
        ).trim() || "Compromisso",
      when: parseDateTime(content, undefined, tz),
      visibility: detectExplicitVisibility(content),
    };
  }

  if (normalized.includes("gastei") || normalized.includes("paguei") || normalized.includes("comprei")) {
    return {
      intent: "registrar_gasto",
      amount: parseAmount(content),
      description: cleanDescription(content) || undefined,
      category: inferCategory(content, "expense"),
      visibility: detectExplicitVisibility(content),
      accountType: detectAccountType(content),
      paymentMethod: detectPaymentMethod(content),
    };
  }

  if (normalized.includes("recebi") || normalized.includes("ganhei") || normalized.includes("entrou")) {
    return {
      intent: "registrar_receita",
      amount: parseAmount(content),
      description: cleanDescription(content) || "Entrada",
      category: inferCategory(content, "income"),
      visibility: "personal",
      accountType: detectAccountType(content) || "personal",
      paymentMethod: detectPaymentMethod(content) || "pix",
    };
  }

  if (
    normalized.includes("zerar") ||
    normalized.includes("resetar") ||
    normalized.includes("limpar tudo") ||
    normalized.includes("apagar tudo") ||
    normalized.includes("começar de novo") ||
    normalized.includes("começar do zero")
  ) {
    return { intent: "reset_dados" };
  }

  if (
    normalized === "cancelar" ||
    normalized.includes("cancelar último") ||
    normalized.includes("cancelar ultimo") ||
    normalized.includes("apagar último") ||
    normalized.includes("apagar ultimo") ||
    normalized.includes("desfazer último") ||
    normalized.includes("desfazer ultimo") ||
    normalized.includes("excluir último") ||
    normalized.includes("excluir ultimo") ||
    normalized.includes("delete o último") ||
    normalized.includes("apaga o último") ||
    normalized.includes("cancela o último") ||
    normalized.includes("cancela último") ||
    normalized.includes("erro, cancela") ||
    normalized.includes("errei, cancela") ||
    normalized.includes("lançamento errado")
  ) {
    return { intent: "cancelar_lancamento" };
  }

  if (
    normalized.includes("paguei o cartao") ||
    normalized.includes("paguei a fatura") ||
    normalized.includes("liquidar fatura") ||
    normalized.includes("fatura paga") ||
    normalized.includes("fatura do cartao paga")
  ) {
    return { intent: "registrar_pagamento_fatura" };
  }

  return { intent: "indefinido" };
}

function hasEnoughRuleConfidence(parsed: ParsedMessage) {
  if (parsed.intent === "indefinido") return false;
  if (parsed.intent === "registrar_gasto" || parsed.intent === "registrar_receita") {
    return Boolean(parsed.amount && parsed.description);
  }
  if (
    parsed.intent === "registrar_compromisso" ||
    parsed.intent === "registrar_lembrete" ||
    parsed.intent === "registrar_conta"
  ) {
    return Boolean(parsed.when);
  }
  return true;
}

function mapAIResultToParsed(ai: AIParsedMessage, tz = "America/Sao_Paulo"): ParsedMessage {
  const parsedDate = ai.data ? parseDateTime(ai.data, undefined, tz) ?? new Date(ai.data) : undefined;
  return {
    intent: ai.intent as ParsedIntent,
    amount: ai.valor ?? undefined,
    category: ai.categoria ?? undefined,
    description: ai.descricao ?? undefined,
    title: ai.titulo ?? undefined,
    when: parsedDate,
    notes: ai.observacoes ?? undefined,
    visibility: ai.visibilidade === "shared" || ai.visibilidade === "personal"
      ? ai.visibilidade
      : undefined,
    installments: ai.parcelas ?? undefined,
    conta: ai.conta ?? undefined,
    contaDestino: ai.conta_destino ?? undefined,
    fiscalContext: ai.contexto_fiscal ?? "personal",
    contextUncertain: ai.contexto_incerto ?? false,
    projeto: ai.projeto ?? undefined,
  };
}

async function interpretMessage(content: string, identity: Identity, tz = "America/Sao_Paulo") {
  const parsedByRules = parseMessageByRules(content, tz);
  if (hasEnoughRuleConfidence(parsedByRules)) return [parsedByRules];

  const { data: aiResult, usage } = await interpretTextWithOpenAI(content, new Date().toISOString());
  
  await logAiAction({
    userId: identity.user.id,
    householdId: identity.household.id,
    model: "gpt-4o-mini",
    input: content,
    output: JSON.stringify(aiResult),
    tokens: usage?.total_tokens,
    promptVersion: "v5-interpreter"
  });

  if (!aiResult || !aiResult.transacoes || aiResult.transacoes.length === 0) return [parsedByRules];

  return aiResult.transacoes.map(t => {
    const parsedByAI = mapAIResultToParsed(t, tz);
    if (parsedByAI.intent !== "indefinido") {
      parsedByAI.paymentMethod = parsedByAI.paymentMethod || parsedByRules.paymentMethod || detectPaymentMethod(content);
      parsedByAI.accountType = parsedByAI.accountType || parsedByRules.accountType || detectAccountType(content);
      parsedByAI.fiscalContext = parsedByAI.fiscalContext || (content.toLowerCase().includes("pj") || content.toLowerCase().includes("empresa") ? "business" : "personal");
      return parsedByAI;
    }
    return parsedByRules;
  });
}

async function applyReplyPrompt(reply: string, identity: Identity | null | undefined) {
  if (!identity?.user || !identity?.household) {
    return reply; // sem identity, retorna o reply original sem tentar reescrever
  }

  const prompt = systemSettings.botReplyPrompt?.trim();
  if (!prompt) {
    return reply;
  }

  const { reply: rewritten, usage } = await rewriteReplyWithOpenAI(reply, prompt);
  
  await logAiAction({
    userId: identity.user.id,
    householdId: identity.household.id,
    model: "gpt-4o-mini",
    input: reply,
    output: rewritten ?? undefined,
    tokens: usage?.total_tokens,
    promptVersion: "v5-rewriter"
  });

  return rewritten || reply;
}

async function getIdentityByPhone(phone: string) {
  const normalizedPhone = normalizeBrazilPhone(phone);
  const normalizedVariants = expandBrazilPhoneVariants(phone);
  const users = await db.select().from(usersTable);

  const existingUser = users.find((item) => {
    const itemVariants = expandBrazilPhoneVariants(item.phone);
    return normalizedVariants.some((v) => itemVariants.includes(v));
  }) ?? null;

  if (!existingUser) {
    return null;
  }

  const [member] = await db
    .select()
    .from(householdMembersTable)
    .where(eq(householdMembersTable.userId, existingUser.id))
    .limit(1);
  const [household] = existingUser.householdId
    ? await db
        .select()
        .from(householdsTable)
        .where(eq(householdsTable.id, existingUser.householdId))
        .limit(1)
    : [null];
  const [subscription] = existingUser.householdId
    ? await db
        .select()
        .from(subscriptionsTable)
        .where(eq(subscriptionsTable.householdId, existingUser.householdId))
        .orderBy(desc(subscriptionsTable.createdAt))
        .limit(1)
    : [null];

  if (!household) {
    return null;
  }

  return { user: existingUser, member: member ?? null, household, subscription: subscription ?? null };
}

async function getIdentityByUserId(userId: number) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user || !user.householdId) {
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
  const [subscription] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.householdId, user.householdId))
    .orderBy(desc(subscriptionsTable.createdAt))
    .limit(1);

  if (!household) {
    return null;
  }

  return { user, member: member ?? null, household, subscription: subscription ?? null };
}

function buildUnregisteredReply() {
  const appBaseUrl = getAppBaseUrl();
  const baseMessage = resolveBotTemplateMessage(
    systemSettings.botUnregisteredAccessMessage?.trim() ||
      "Olá! Notei que esse número de WhatsApp ainda não está vinculado a uma conta no Contai.",
    appBaseUrl,
  );

  return [
    baseMessage,
    "",
    "🚀 *Como liberar seu acesso agora:*",
    "1. Acesse o Painel do Contai.",
    "2. Crie sua conta usando este número.",
    "3. Escolha um plano para ativar o robô.",
    "",
    `👉 *Comece aqui:* ${appBaseUrl}/cadastro`,
    "",
    "Te espero lá para começarmos a organizar suas finanças!",
  ].join("\n");
}

function buildInactivePlanReply() {
  const appBaseUrl = getAppBaseUrl();
  const loginUrl = `${appBaseUrl}/login?next=${encodeURIComponent("/app/assinatura")}`;
  const baseMessage = resolveBotTemplateMessage(
    systemSettings.botInactivePlanMessage?.trim() ||
      "Identifiquei seu cadastro no Contai, mas você ainda não possui um plano ativo para liberar o acesso ao robô.",
    appBaseUrl,
  );

  return [
    baseMessage,
    "",
    "💡 Para liberar as anotações automáticas e lembretes por aqui, você precisa ativar seu plano.",
    "",
    `💳 *Ative seu plano no Painel:* ${loginUrl}`,
    "",
    "Assim que confirmar, eu estarei pronto para te ajudar!",
  ].join("\n");
}

function buildExpiredPlanReply() {
  const appBaseUrl = getAppBaseUrl();
  const loginUrl = `${appBaseUrl}/login?next=${encodeURIComponent("/app/assinatura")}`;

  return [
    "⚠️ *Seu plano Contai venceu!*",
    "",
    "Notei que sua assinatura expirou e, por isso, as funções do robô foram pausadas.",
    "",
    "Para continuar organizando suas finanças e não perder nenhum lembrete, regularize seu acesso abaixo:",
    "",
    `🔗 *Renovar Assinatura:* ${loginUrl}`,
    "",
    "Te espero de volta para continuarmos!",
  ].join("\n");
}

function getSubscriptionStatus(identity: Identity): "active" | "expired" | "inactive" {
  if (
    identity.user.billingStatus === "active" ||
    (identity.household && identity.household.billingStatus === "active")
  ) {
    return "active";
  }

  const subscription = identity.subscription;
  if (!subscription) {
    return "inactive";
  }

  const status = String(subscription.status ?? "").trim().toLowerCase();
  if (status !== "active") {
    return "inactive";
  }

  if (subscription.endsAt < new Date()) {
    return "expired";
  }

  return "active";
}

async function validateBotAccess(phone: string): Promise<BotAccessResult> {
  const identity = await getIdentityByPhone(phone);

  if (!identity || !identity.household) {
    return {
      ok: false,
      intent: "ajuda",
      reply: buildUnregisteredReply(),
    };
  }

  const status = getSubscriptionStatus(identity);

  if (status === "expired") {
    return {
      ok: false,
      intent: "ajuda",
      reply: buildExpiredPlanReply(),
      identity,
    };
  }

  if (status === "inactive") {
    return {
      ok: false,
      intent: "ajuda",
      reply: buildInactivePlanReply(),
      identity,
    };
  }

  return { ok: true, identity };
}

async function logConversation(params: {
  householdId?: number | null;
  memberId?: number | null;
  userId?: number | null;
  originalContent: string;
  content: string;
  intent: ParsedIntent;
  direction: "inbound" | "outbound";
  source?: string;
  messageType?: MessageKind;
  sourceType?: MessageKind;
  structuredData?: unknown;
  transcribedContent?: string | null;
  imageAnalysis?: unknown;
}) {
  await db.insert(conversationLogsTable).values({
    householdId: params.householdId ?? null,
    memberId: params.memberId ?? null,
    userId: params.userId ?? null,
    originalContent: params.originalContent,
    transcribedContent: params.transcribedContent ?? null,
    imageAnalysis: params.imageAnalysis ?? null,
    content: params.content,
    intent: params.intent,
    direction: params.direction,
    source: params.source ?? DEFAULT_SOURCE,
    messageType: params.messageType ?? "text",
    sourceType: params.sourceType ?? params.messageType ?? "text",
    structuredData: params.structuredData ?? null,
  });
}

async function buildMonthlySummary(
  householdId: number,
  category?: string,
  visibility?: Visibility,
  memberId?: number,
  tz = "America/Sao_Paulo",
) {
  const start = startOfMonth(undefined, tz);
  const end = endOfMonth(undefined, tz);
  const conditions = [
    eq(transactionsTable.householdId, householdId),
    gte(transactionsTable.transactionDate, start),
    lte(transactionsTable.transactionDate, end),
    eq(transactionsTable.type, "expense"),
    eq(transactionsTable.status, "paid"),
  ];
  if (category) conditions.push(ilike(transactionsTable.category, category));
  if (visibility) conditions.push(eq(transactionsTable.visibility, visibility));
  if (memberId) conditions.push(eq(transactionsTable.memberId, memberId));

  const rows = await db
    .select({
      category: transactionsTable.category,
      total: sql<string>`coalesce(sum(${transactionsTable.amount}), 0)`,
    })
    .from(transactionsTable)
    .where(and(...conditions))
    .groupBy(transactionsTable.category)
    .orderBy(sql`sum(${transactionsTable.amount}) desc`);

  return {
    total: rows.reduce((sum, row) => sum + toAmountNumber(row.total), 0),
    topCategory: rows[0]?.category ?? null,
  };
}

function needsVisibilityDecision(identity: Identity, parsed: ParsedMessage, content: string) {
  if (!identity.household || !["couple", "family"].includes(identity.household.type)) {
    return false;
  }

  if (
    parsed.intent !== "registrar_gasto" &&
    parsed.intent !== "registrar_conta" &&
    parsed.intent !== "registrar_compromisso"
  ) {
    return false;
  }

  if (parsed.visibility) {
    return false;
  }

  const inferred = inferSharedByContext(parsed, content);
  if (inferred) {
    parsed.visibility = inferred;
    return false;
  }

  return true;
}

async function getPendingDecision(identity: Identity) {
  const rows = await db
    .select()
    .from(pendingDecisionsTable)
    .where(
      and(
        eq(pendingDecisionsTable.householdId, identity.household.id),
        or(
          eq(pendingDecisionsTable.userId, identity.user.id),
          identity.member?.id
            ? eq(pendingDecisionsTable.memberId, identity.member.id)
            : eq(pendingDecisionsTable.userId, identity.user.id),
        ),
      ),
    )
    .orderBy(desc(pendingDecisionsTable.createdAt))
    .limit(1);

  const decision = rows[0] ?? null;
  if (!decision) return null;

  // Timeout de Expiração (Filtro Anti-Amnésia) - 5 minutos de validade do contexto
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  if (decision.createdAt < fiveMinutesAgo) {
    await clearPendingDecision(decision.id);
    return null;
  }

  return decision;
}

async function createPendingDecision(
  identity: Identity,
  kind: PendingKind,
  question: string,
  payload: PendingPayload,
  stepArg: number = 0,
  accumulatedDataArg: any = {}
) {
  // Limpa as pendências antigas para não criar uma "fila de amnésia" em que o robô
  // pergunta coisas de contextos diferentes pro usuário.
  await db.delete(pendingDecisionsTable).where(
    and(
      eq(pendingDecisionsTable.householdId, identity.household.id),
      or(
        eq(pendingDecisionsTable.userId, identity.user.id),
        identity.member?.id
          ? eq(pendingDecisionsTable.memberId, identity.member.id)
          : eq(pendingDecisionsTable.userId, identity.user.id),
      ),
    )
  );

  await db.insert(pendingDecisionsTable).values({
    householdId: identity.household.id,
    memberId: identity.member?.id ?? null,
    userId: identity.user.id,
    kind,
    question,
    payload,
    step: stepArg,
    accumulatedData: accumulatedDataArg,
  });
}

async function clearPendingDecision(id: number) {
  await db.delete(pendingDecisionsTable).where(eq(pendingDecisionsTable.id, id));
}

function replyForPendingQuestion(kind: PendingKind) {
  if (kind === "registrar_compromisso") {
    return "Esse compromisso é só seu ou compartilhado?";
  }
  return "É da casa ou só seu?";
}

async function getAccumulatedCreditSpend(identity: Identity) {
  const start = startOfMonth(undefined, identity.user.timezone);
  const end = endOfMonth(undefined, identity.user.timezone);

  const [row] = await db
    .select({ total: sql<string>`sum(${transactionsTable.amount})` })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.householdId, identity.household.id),
        eq(transactionsTable.paymentMethod, "credito"),
        eq(transactionsTable.type, "expense"),
        eq(transactionsTable.status, "paid"),
        gte(transactionsTable.transactionDate, start),
        lte(transactionsTable.transactionDate, end),
        identity.member?.id 
          ? eq(transactionsTable.memberId, identity.member.id)
          : eq(transactionsTable.accountType, "personal")
      )
    );

  return toAmountNumber(row?.total || "0");
}

async function checkBudgetAlerts(identity: Identity, categoryName: string, amount: number) {
  const alerts: string[] = [];
  const start = startOfMonth(undefined, identity.user.timezone);
  const end = endOfMonth(undefined, identity.user.timezone);

  // 1. Alerta por Categoria
  const [category] = await db
    .select()
    .from(categoriesTable)
    .where(and(eq(categoriesTable.householdId, identity.household.id), ilike(categoriesTable.name, categoryName)))
    .limit(1);

  if (category && category.monthlyLimit) {
    const limit = toAmountNumber(category.monthlyLimit);
    const summary = await buildMonthlySummary(identity.household.id, categoryName, undefined, undefined, identity.user.timezone);
    const totalWithThis = summary.total + amount;

    if (totalWithThis >= limit) {
      alerts.push(`🚨 *META ATINGIDA:* Você atingiu o limite de *${formatCurrency(limit)}* definido para *${categoryName}*!`);
    } else if (totalWithThis >= limit * 0.8) {
      alerts.push(`⚠️ *ALERTA DE GASTO:* Você atingiu 80% do limite de *${formatCurrency(limit)}* para *${categoryName}*.`);
    }
  }

  // 2. Alerta Orçamento Total da Casa
  if (identity.household.monthlyIncome) {
    const income = toAmountNumber(identity.household.monthlyIncome);
    const houseSpending = await db
      .select({ total: sql<string>`coalesce(sum(${transactionsTable.amount}), 0)` })
      .from(transactionsTable)
      .where(and(
        eq(transactionsTable.householdId, identity.household.id),
        eq(transactionsTable.type, "expense"),
        eq(transactionsTable.accountType, "house"),
        eq(transactionsTable.status, "paid"),
        gte(transactionsTable.transactionDate, start),
        lte(transactionsTable.transactionDate, end)
      ));
    
    const totalHouseSpent = toAmountNumber(houseSpending[0]?.total) + (identity.household.type !== "individual" ? amount : 0);
    if (totalHouseSpent >= income) {
      alerts.push(`🔴 *ORÇAMENTO ESGOTADO:* Os gastos da casa superaram sua renda mensal de *${formatCurrency(income)}*!`);
    } else if (totalHouseSpent >= income * 0.85) {
      alerts.push(`🟡 *ATENÇÃO:* Os gastos da casa já consumiram 85% da renda mensal planejada.`);
    }
  }

  return alerts;
}

async function getHistoricalSpendingSummary(householdId: number, months = 6) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  startDate.setDate(1);

  const rows = await db
    .select({
      month: sql<string>`to_char(${transactionsTable.transactionDate}, 'YYYY-MM')`,
      category: transactionsTable.category,
      total: sql<string>`sum(${transactionsTable.amount})`,
    })
    .from(transactionsTable)
    .where(and(
      eq(transactionsTable.householdId, householdId),
      eq(transactionsTable.type, "expense"),
      eq(transactionsTable.status, "paid"),
      gte(transactionsTable.transactionDate, startDate),
      lte(transactionsTable.transactionDate, endDate)
    ))
    .groupBy(sql`to_char(${transactionsTable.transactionDate}, 'YYYY-MM')`, transactionsTable.category)
    .orderBy(sql`to_char(${transactionsTable.transactionDate}, 'YYYY-MM') desc`, sql`sum(${transactionsTable.amount}) desc`);

  if (!rows.length) return "Sem histórico suficiente para análise.";

  return rows.map(r => `[${r.month}] ${r.category}: ${formatCurrency(toAmountNumber(r.total))}`).join("\n");
}

import { checkEscapeCommand } from "./engine/middleware/escapeCommands";
import { processContextualResponse, initializeFlowState } from "./engine/contextManager";

async function predictCategory(householdId: number, description: string, intent: string): Promise<string> {
  const defaultCategory = intent === "registrar_gasto" ? "Outros" : "Freela";
  if (!description) return defaultCategory;
  
  // Clean description and extract keywords
  const words = description.toLowerCase().split(/\\s+/).filter(w => w.trim().length > 3);
  if (words.length === 0) return defaultCategory;
  
  try {
    const type = intent === "registrar_gasto" ? "expense" : "income";
    
    const conditions = [
       eq(transactionsTable.householdId, householdId),
       eq(transactionsTable.type, type),
       sql`(${sql.join(words.map(w => ilike(transactionsTable.description, `%${w}%`)), sql` OR `)})`
    ];

    const rows = await db
      .select({ 
         category: transactionsTable.category, 
         count: sql<number>`count(*)`.as("cnt")
      })
      .from(transactionsTable)
      .where(and(...conditions))
      .groupBy(transactionsTable.category)
      .orderBy(sql`count(*) desc`)
      .limit(1);

    if (rows && rows.length > 0 && rows[0].category) {
       return rows[0].category;
    }
  } catch (error) {
     logger.error({ error }, "Failed to predict category from history.");
  }
  return defaultCategory;
}

async function saveParsedAction(
  identity: Identity,
  parsed: ParsedMessage,
  input: ProcessIncomingMessageInput,
  options: SaveParsedActionOptions & { confirmedHighValue?: boolean } = {},
): Promise<{ reply: string; isMissingInfo?: boolean; triggerHighValueConfirmation?: boolean; triggerFiscalClarification?: boolean; triggerAccountTypeClarification?: boolean }> {
  const previewOnly = options.previewOnly === true;
  const replyDate = new Date();
  const appBaseUrl = getAppBaseUrl();

  switch (parsed.intent) {
    case "registrar_gasto":
    case "registrar_receita": {
      if (parsed.intent === "registrar_gasto" && !parsed.description) return { reply: "Foi gasto com o quê?", isMissingInfo: true };
      if (!parsed.amount) return { reply: parsed.intent === "registrar_gasto" ? "Qual foi o valor?" : "Qual foi o valor da entrada?", isMissingInfo: true };

      // 0. Verificar Incerteza de Contexto (PF/PJ/Casa)
      if (parsed.contextUncertain && !options.confirmedHighValue) {
        return {
          reply: `Opa! Anotei seu registro de *${formatCurrency(parsed.amount)}*, mas fiquei na dúvida: ele é **Pessoal**, da **Empresa (PJ)** ou da **Casa (Compartilhado)**?`,
          isMissingInfo: true,
          triggerFiscalClarification: true
        };
      }

      // 1. Verificar informações faltantes (Regra do Maicon)
      // Sempre pergunta quando o tipo não vier explícito na mensagem do usuário.
      // Não fazemos mais inferência automática por categoria (ex: "Mercado" → casa),
      // pois um mesmo gasto pode ser pessoal ou da casa dependendo do contexto.
      if (!parsed.accountType && identity.household.type !== "individual") {
        return { reply: "Me fala só mais uma coisa pra organizar certo: esse registro é da sua *conta pessoal* ou da *conta da casa*?", isMissingInfo: true, triggerAccountTypeClarification: true };
      }
      if (!parsed.paymentMethod) {
        if (parsed.intent === "registrar_receita") {
          parsed.paymentMethod = "pix";
        } else {
          return { reply: "E qual foi a forma de pagamento? (débito, crédito, pix, dinheiro ou boleto)", isMissingInfo: true };
        }
      }

      const accountType = parsed.accountType || "personal";
      const paymentMethod = parsed.paymentMethod!;
      const amount = parsed.amount;
      const description = parsed.description || "Entrada";
      let category = parsed.category;
      if (!category) {
        category = await predictCategory(identity.household.id, description, parsed.intent);
      }
      const visibility = accountType === "house" ? "shared" : "personal";
      const fiscalContext = parsed.fiscalContext || "personal";

      const oldPersonalBalance = toAmountNumber(identity.user.personalBalance);
      const oldUserHouseBalance = toAmountNumber(identity.member?.householdBalance);
      const oldTotalHouseBalance = toAmountNumber(identity.household.totalHouseBalance);



      let newPersonalBalance = oldPersonalBalance;
      let newUserHouseBalance = oldUserHouseBalance;
      let newTotalHouseBalance = oldTotalHouseBalance;

      // V5: Account Selection
      const account = await findAccount(identity.household.id, parsed.conta, paymentMethod === "credito" ? "credit" : "checking");
      const accountId = account.id;

      // Logic for Multi-installments (Parcelas)
      const installments = parsed.installments && parsed.installments > 1 ? parsed.installments : 1;
      const parsedAmount = amount;
      
      const currentAmount = parsedAmount;

      if (parsed.intent === "registrar_receita") {
        if (accountType === "personal") {
          newPersonalBalance += currentAmount;
        } else {
          newUserHouseBalance += currentAmount;
          newTotalHouseBalance += currentAmount;
        }
        
        // Update Account Balance
        if (!previewOnly) {
          await db.update(accountsTable)
            .set({ balance: (toAmountNumber(account.balance) + currentAmount).toFixed(2) })
            .where(eq(accountsTable.id, accountId));
        }
      } else {
        // Regra do Maicon: Se for Crédito, NÃO desconta do saldo agora (Fluxo de Caixa)
        if (account.type !== "credit") {
          if (accountType === "personal") {
            newPersonalBalance -= currentAmount;
          } else {
            newUserHouseBalance -= currentAmount;
            newTotalHouseBalance -= currentAmount;
          }
        }
        
        // Update Account Balance
        if (!previewOnly) {
           await db.update(accountsTable)
            .set({ balance: (toAmountNumber(account.balance) - currentAmount).toFixed(2) })
            .where(eq(accountsTable.id, accountId));
        }
      }

      const budgetAlerts = !previewOnly && parsed.intent === "registrar_gasto"
        ? await checkBudgetAlerts(identity, category, currentAmount)
        : [];

      // # PROJETOS (Fase 2)
      if (parsed.projeto) {
        const project = await findOrCreateProject(identity.household.id, parsed.projeto);
        parsed.projectId = project.id;
      }

      if (!previewOnly) {
        await db.insert(transactionsTable).values({
          householdId: identity.household.id,
          memberId: identity.member?.id ?? null,
          accountId: accountId,
          type: parsed.intent === "registrar_gasto" ? "expense" : "income",
          amount: currentAmount.toFixed(2),
          category,
          description: installments > 1 ? `[1/${installments}] ${description}` : description,
          visibility,
          accountType,
          paymentMethod,
          sourceType: input.messageType ?? "text",
          source: input.source ?? DEFAULT_SOURCE,
          transactionDate: replyDate,
          fiscalContext,
          projectId: parsed.projectId ?? null,
          createdBy: identity.member?.displayName || identity.user.name,
        });

        // Registrar parcelas no Contas a Pagar
        if (installments > 1) {
          const installmentBills = [];
          for (let i = 2; i <= installments; i++) {
            const nextMonthDate = new Date(replyDate);
            nextMonthDate.setMonth(nextMonthDate.getMonth() + i - 1);
            
            installmentBills.push({
              householdId: identity.household.id,
              memberId: identity.member?.id ?? null,
              title: `[${i}/${installments}] ${description}`,
              amount: currentAmount.toFixed(2),
              category,
              dueDate: nextMonthDate,
              isRecurring: false,
              status: "pending",
              visibility,
              type: parsed.intent === "registrar_gasto" ? "payable" : "receivable",
              sourceType: input.messageType ?? "text",
              fiscalContext,
            });
          }
          await db.insert(billsTable).values(installmentBills);
        }

        // Atualizar saldos
        await db.update(usersTable).set({ personalBalance: newPersonalBalance.toFixed(2) }).where(eq(usersTable.id, identity.user.id));
        if (identity.member) {
          await db.update(householdMembersTable).set({ householdBalance: newUserHouseBalance.toFixed(2) }).where(eq(householdMembersTable.id, identity.member.id));
        }
        await db.update(householdsTable).set({ totalHouseBalance: newTotalHouseBalance.toFixed(2) }).where(eq(householdsTable.id, identity.household.id));
      }

      // 4. Formatar Resposta (Template do Maicon)
      const firstName = getFirstName(identity.user.name);
      const icon = parsed.intent === "registrar_gasto" ? "💸" : "💰";
      const actionText = parsed.intent === "registrar_gasto" ? "gastou com" : "recebeu de";
      const statusText = parsed.intent === "registrar_gasto" ? "Pago" : "Recebido";
      const isExpense = parsed.intent === "registrar_gasto";
      const typeLabel = accountType === "house" 
        ? `🏠 Tipo: ${isExpense ? "Gasto da casa" : "Receita da casa"}` 
        : `👤 Tipo: Pessoal`;
      const fiscalLabel = fiscalContext === "business" ? "💼 Contexto: Empresarial (PJ)" : "👤 Contexto: Pessoal (PF)";
      const projectLabel = parsed.projeto ? `🏗️ Projeto: ${parsed.projeto}` : "";
      
      const response = [
        `Anotei os ${formatCurrency(amount)} que você ${actionText} ${description} hoje, ${firstName}. Tudo já está organizado para você.`,
        "",
        "📋 *Resumo da transação:*",
        `🧾 *Descrição:* ${capitalizeLabel(description)}`,
        `${icon} *Valor:* ${formatCurrency(amount)}`,
        `📂 *Categoria:* ${category}`,
        `📅 *Data:* ${formatFullDate(replyDate)}`,
        `✅ *Status:* ${statusText}`,
        typeLabel,
        fiscalLabel,
        projectLabel,
        `💳 *Pagamento:* ${capitalizeLabel(paymentMethod)}`,
        accountType === "house" ? `👤 *Lançado por:* ${firstName}` : "",
        "",
      ];

      // Alerta de Fatura de Cartão de Crédito
      if (paymentMethod === "credito" && parsed.intent === "registrar_gasto") {
        const accumulatedCredit = await getAccumulatedCreditSpend(identity);
        const warning = accumulatedCredit > 1000 ? "⚠️ *Cuidado:* Sua fatura tá ficando alta!" : "Tudo sob controle.";
        response.push(`💳 *Obs:* Por ser no crédito, seu saldo imediato não mudou.`);
        response.push(`📉 *Fatura acumulada para o mês:* ${formatCurrency(accumulatedCredit)}`);
        response.push(warning);
        response.push("");
      }

      if (installments > 1) {
        response.splice(1, 0, `*Aviso:* A sua 1ª parcela tá nas transações de hoje. Lancei e organizei as outras ${installments - 1} parcelas na sua aba de Contas a Pagar dos próximos meses!`);
      }

      response.push(`🏦 *Conta:* ${account.name}`);
      
      if (account.type === "credit") {
        response.push(`💳 *Obs:* Lançado no crédito, seu saldo imediato em conta não foi alterado.`);
      }

      if (accountType === "personal") {
        response.push(`💰 *Saldo anterior:* ${formatCurrency(oldPersonalBalance)}`);
        response.push(`${icon} *Valor ${parsed.intent === "registrar_gasto" ? "descontado" : "adicionado"}:* ${formatCurrency(amount)}`);
        response.push(`✅ *Seu saldo pessoal atual:* ${formatCurrency(newPersonalBalance)}`);
      } else {
        response.push(`💰 *Seu saldo na casa antes:* ${formatCurrency(oldUserHouseBalance)}`);
        response.push(`${icon} *Seu ${parsed.intent === "registrar_gasto" ? "gasto" : "ganho"} na casa:* ${formatCurrency(amount)}`);
        response.push(`✅ *Seu saldo na casa agora:* ${formatCurrency(newUserHouseBalance)}`);
        response.push("");
        response.push(`👥 *Saldo total da casa agora:* ${formatCurrency(newTotalHouseBalance)}`);
      }

      response.push("");
      response.push(previewOnly ? "🧪 _Isso é um teste do painel do bot._" : `📊 *Para ver todos os detalhes e gráficos, acesse seu Painel:* ${appBaseUrl}/app/dashboard`);

      if (budgetAlerts.length > 0) {
        response.push("", ...budgetAlerts);
      }

      if (parsed.intent === "registrar_receita") {
        const accumulatedCredit = await getAccumulatedCreditSpend(identity);
        if (accumulatedCredit > 0) {
          const freeBalance = (accountType === "house" ? newUserHouseBalance : newPersonalBalance) - accumulatedCredit;
          response.push("");
          response.push(`⚠️ *Lembrete de Fatura:* Você já comprometeu *${formatCurrency(accumulatedCredit)}* no crédito.`);
          response.push(`✨ *Saldo 'Livre' Projetado:* ${formatCurrency(freeBalance)}`);
        }
      }

      if (!previewOnly) {
        response.push("");
        response.push(`_💡 Registrou errado? Mande "cancelar último" que eu apago pra você!_`);
      }

      return { reply: response.filter(l => l !== undefined).join("\n") };
    }

    case "registrar_pagamento_fatura": {
      const accumulatedCredit = await getAccumulatedCreditSpend(identity);
      if (accumulatedCredit <= 0) {
        return { reply: "Não encontrei nenhuma fatura acumulada no crédito para liquidar agora! Seu saldo está limpo. ✅" };
      }

      const oldPersonalBalance = toAmountNumber(identity.user.personalBalance);
      const oldUserHouseBalance = toAmountNumber(identity.member?.householdBalance);
      const oldTotalHouseBalance = toAmountNumber(identity.household.totalHouseBalance);

      // Por padrão, liquida da conta pessoal (ou da casa se for contexto de casa)
      // Para simplificar, vamos descontar de onde o usuário tem saldo
      let target = "pessoal";
      let newPersonal = oldPersonalBalance;
      let newHouseMember = oldUserHouseBalance;
      let newHouseTotal = oldTotalHouseBalance;

      if (oldPersonalBalance >= accumulatedCredit) {
        newPersonal -= accumulatedCredit;
        target = "pessoal";
      } else if (oldUserHouseBalance >= accumulatedCredit) {
        newHouseMember -= accumulatedCredit;
        newHouseTotal -= accumulatedCredit;
        target = "da casa";
      } else {
        return { reply: `Você precisa ter pelo menos ${formatCurrency(accumulatedCredit)} em algum dos saldos para eu liquidar a fatura automaticamente. Recarregue seu saldo primeiro!` };
      }

      if (!previewOnly) {
        await db.update(usersTable).set({ personalBalance: newPersonal.toFixed(2) }).where(eq(usersTable.id, identity.user.id));
        if (identity.member) {
          await db.update(householdMembersTable).set({ householdBalance: newHouseMember.toFixed(2) }).where(eq(householdMembersTable.id, identity.member.id));
        }
        await db.update(householdsTable).set({ totalHouseBalance: newHouseTotal.toFixed(2) }).where(eq(householdsTable.id, identity.household.id));
      
        // Registrar a transação de ajuste de liquidação para histórico
        await db.insert(transactionsTable).values({
          householdId: identity.household.id,
          memberId: identity.member?.id ?? null,
          type: "expense",
          amount: accumulatedCredit.toFixed(2),
          category: "Cartão de Crédito",
          description: "Liquidação de Fatura Acumulada",
          visibility: target === "da casa" ? "shared" : "personal",
          accountType: target === "da casa" ? "house" : "personal",
          paymentMethod: "debito", // Foi pago agora, sai o cash
          transactionDate: replyDate,
          createdBy: "Sistema Contai",
        });
      }

      return { reply: `✅ *Fatura Liquidada!* Descontei ${formatCurrency(accumulatedCredit)} do seu saldo ${target}. Agora você está em dia! 🚀` };
    }

    case "consulta_resumo": {
      const personal = toAmountNumber(identity.user.personalBalance);
      const memberHouse = toAmountNumber(identity.member?.householdBalance);
      const totalHouse = toAmountNumber(identity.household.totalHouseBalance);

      const response = [
        "💰 *Seu saldo pessoal:* " + formatCurrency(personal),
        "🏠 *Seu saldo na casa:* " + formatCurrency(memberHouse),
        "👥 *Saldo total da casa:* " + formatCurrency(totalHouse),
        "",
        `📊 Para mais detalhes, acesse: ${appBaseUrl}/app/dashboard`
      ];

      return { reply: response.join("\n") };
    }

    case "consulta_categoria": {
      const summary = await buildMonthlySummary(identity.household.id, parsed.category, undefined, undefined, identity.user.timezone);
      return { reply: `📊 Neste mês vocês gastaram ${formatCurrency(summary.total)} com ${parsed.category}.` };
    }

    case "consulta_histórico": {
      const rows = await db
        .select()
        .from(transactionsTable)
        .where(and(eq(transactionsTable.householdId, identity.household.id), eq(transactionsTable.status, "paid")))
        .orderBy(desc(transactionsTable.transactionDate))
        .limit(4);

      return {
        reply: rows
          .map(
            (row) =>
              `${row.type === "income" ? "💰" : "💸"} ${formatCurrency(toAmountNumber(row.amount))} • ${row.category}`,
          )
          .join("\n")
      };
    }

    case "registrar_conta": {
      if (!parsed.when) return { reply: "Que dia vence essa conta?", isMissingInfo: true };
      let syncedToGoogle = false;
      if (!previewOnly) {
        const [bill] = await db.insert(billsTable).values({
          householdId: identity.household.id,
          memberId: identity.member?.id ?? null,
          title: parsed.title?.trim() || "Conta",
          amount: parsed.amount ? parsed.amount.toFixed(2) : null,
          category: parsed.category ?? "Contas",
          dueDate: parsed.when!,
          isRecurring: false,
          status: "pending",
          visibility: parsed.visibility ?? "shared",
          type: "payable",
          sourceType: input.messageType ?? "text",
        }).returning();
        try {
          const syncResult = await syncBillForUser(identity.user.id, bill);
          syncedToGoogle = syncResult.synced;
        } catch {
          syncedToGoogle = false;
        }
      }
      return { reply: `🔔 Conta salva para ${formatShortDate(parsed.when!)}.${
        parsed.visibility === "shared" ? " Salvei como conta da casa." : " Salvei como conta pessoal."
      }${syncedToGoogle ? " Também deixei esse vencimento no seu Google Agenda." : ""}\n\n📊 *Acompanhe no Painel:* ${appBaseUrl}/app/dashboard${previewOnly ? "\n(Este foi só um teste do painel)." : ""}` };
    }

    case "registrar_lembrete": {
      if (!parsed.when) return { reply: "Que dia você quer que eu te lembre?", isMissingInfo: true };
      const when = parsed.when!;
      let syncedToGoogle = false;
      if (!previewOnly) {
        const [reminder] = await db.insert(remindersTable).values({
          householdId: identity.household.id,
          memberId: identity.member?.id ?? null,
          type: "custom",
          title: parsed.title?.trim() || "Lembrete",
          description: parsed.notes ?? null,
          reminderDate: when,
          reminderTimeLabel: when.toTimeString().slice(0, 5),
          status: "scheduled",
          sourceType: input.messageType ?? "text",
          source: input.source ?? DEFAULT_SOURCE,
        }).returning();
        try {
          const syncResult = await syncReminderForUser(identity.user.id, reminder);
          syncedToGoogle = syncResult.synced;
        } catch {
          syncedToGoogle = false;
        }
      }
      return { reply: `⏰ Lembrete salvo para ${formatShortDate(when)}.${syncedToGoogle ? " Também adicionei no seu Google Agenda." : ""}\n\n📊 *Ver todos no Painel:* ${appBaseUrl}/app/dashboard${previewOnly ? "\n(Este foi só um teste do painel)." : ""}` };
    }

    case "registrar_compromisso": {
      if (!parsed.when) return { reply: "Qual dia e horário eu devo salvar?", isMissingInfo: true };
      if (options.forceGoogleAgendaBlocked) return { reply: buildGoogleCalendarConnectionReply() };
      if (systemSettings.botGoogleCalendarRequiredForScheduling && !previewOnly) {
        const googleStatus = await getGoogleCalendarStatus(identity.user.id);
        if (!googleStatus.canSync) return { reply: buildGoogleCalendarConnectionReply() };
      }
      let syncedToGoogle = false;
      if (!previewOnly) {
        const [commitment] = await db.insert(commitmentsTable).values({
          householdId: identity.household.id,
          memberId: identity.member?.id ?? null,
          title: parsed.title?.trim() || "Compromisso",
          description: null,
          commitmentDate: parsed.when!,
          visibility: parsed.visibility ?? "personal",
          reminderEnabled: true,
          reminderMinutesBefore: 60,
          sourceType: input.messageType ?? "text",
          source: input.source ?? DEFAULT_SOURCE,
        }).returning();
        try {
          const syncResult = await syncCommitmentForUser(identity.user.id, commitment);
          syncedToGoogle = syncResult.synced;
        } catch {
          syncedToGoogle = false;
        }
        await queueNotificationEvent({
          template: "meeting_scheduled",
          user: identity.user,
          payload: {
            title: parsed.title?.trim() || "Compromisso",
            date: parsed.when!.toISOString(),
            googleCalendarConnected: syncedToGoogle,
          },
        });
      }
      const syncStatusText = syncedToGoogle 
        ? " Também adicionei no seu Google Agenda. ✅" 
        : "\n\n⚠️ *Aviso:* Não consegui sincronizar este evento com o Google Agenda. Por favor, verifique sua conexão no Painel de Integrações.";

      return { reply: `📅 ${parsed.title?.trim() || "Compromisso"} salvo para ${formatShortDate(parsed.when!)}.${
        parsed.visibility === "shared" ? " Salvei como compromisso compartilhado." : " Salvei como compromisso pessoal."
      }${syncStatusText}\n\n📊 *Sua Agenda no Painel:* ${appBaseUrl}/app/dashboard${previewOnly ? "\n(Este foi só um teste do painel)." : ""}` };
    }

    case "analise_financeira": {
      const history = await getHistoricalSpendingSummary(identity.household.id);
      const suggestions = await generateFinancialInsights(history);
      if (!suggestions) {
        return { reply: "Tive uma falha ao analisar seu histórico agora. Tente de novo em alguns instantes!" };
      }
      return { reply: [
        "💡 *Análise de Inteligência Contai*",
        "",
        suggestions,
        "",
        "📊 *Dica:* Mantenha suas anotações em dia para uma análise cada vez mais precisa!"
      ].join("\n") };
    }

    case "reset_dados": {
      if (previewOnly) return { reply: "🧪 Teste de reset de dados. Em produção, isso apagaria todo o seu histórico." };
      const householdId = identity.household.id;
      await db.delete(transactionsTable).where(eq(transactionsTable.householdId, householdId));
      await db.delete(billsTable).where(eq(billsTable.householdId, householdId));
      await db.delete(commitmentsTable).where(eq(commitmentsTable.householdId, householdId));
      await db.delete(remindersTable).where(eq(remindersTable.householdId, householdId));
      await db.delete(conversationLogsTable).where(eq(conversationLogsTable.householdId, householdId));
      return { reply: ["Pronto! Zerei suas contas e compromissos com sucesso.", "Agora você pode começar do zero. O que quer anotar primeiro?"].join("\n") };
    }

    case "cancelar_lancamento": {
      if (previewOnly) return { reply: "🧪 Em produção, isso cancelaria o último lançamento." };

      // Busca a última transação do membro ou do household do usuário
      const memberFilter = identity.member?.id
        ? eq(transactionsTable.memberId, identity.member.id)
        : eq(transactionsTable.householdId, identity.household.id);

      const [lastTx] = await db
        .select()
        .from(transactionsTable)
        .where(and(memberFilter, eq(transactionsTable.status, "paid")))
        .orderBy(desc(transactionsTable.createdAt))
        .limit(1);

      if (!lastTx) {
        return { reply: "Não encontrei nenhum lançamento recente para cancelar. Se precisar de ajuda, me chama! 😊" };
      }

      await db.delete(transactionsTable).where(eq(transactionsTable.id, lastTx.id));

      const txType = lastTx.type === "income" ? "receita" : "gasto";
      const txValue = formatCurrency(toAmountNumber(lastTx.amount));
      const txDesc = lastTx.description || lastTx.category || "sem descrição";

      return {
        reply: [
          `✅ *Último lançamento cancelado!*`,
          ``,
          `❌ ${txType.charAt(0).toUpperCase() + txType.slice(1)}: *${txValue}* (${txDesc})`,
          ``,
          `Seu saldo foi ajustado automaticamente. Algum outro lançamento para eu anotar? 😊`
        ].join("\n")
      };
    }

    case "registrar_meta": {
      if (!parsed.amount) return { reply: "Qual o valor do limite que você quer definir?", isMissingInfo: true };
      const categoryName = parsed.category || "Outros";
      if (!previewOnly) {
        let [category] = await db.select().from(categoriesTable).where(and(eq(categoriesTable.householdId, identity.household.id), eq(categoriesTable.name, categoryName))).limit(1);
        if (!category) {
          await db.insert(categoriesTable).values({ householdId: identity.household.id, name: categoryName, type: "expense", monthlyLimit: parsed.amount!.toFixed(2) });
        } else {
          await db.update(categoriesTable).set({ monthlyLimit: parsed.amount!.toFixed(2) }).where(eq(categoriesTable.id, category.id));
        }
      }
      const amount = parsed.amount!;
      return { reply: `✅ Meta definida! O limite mensal para *${categoryName}* agora é ${formatCurrency(amount)}. Eu te aviso quando você chegar perto desse valor!` };
    }

    case "saudacao": {
      const firstName = getFirstName(identity.user.name);
      const appBaseUrl = getAppBaseUrl();
      const reply = [
        `Fala, *${firstName}*! Seja bem-vindo ao *Contai*! ✨`,
        "",
        "",
        "Estou aqui para ser seu braço direito financeiro. Comigo, você esquece as planilhas e organiza tudo pelo WhatsApp:",
        "",
        "",
        "🔹 *Voz e Texto*: Mande áudios ou mensagens como 'Gastei 50 no almoço'. Eu entendo o seu jeito de falar! ",
        "",
        "🔹 *Visão Pro*: Mande fotos de cupons e recibos. Eu leio os valores e anoto tudo para você. ",
        "",
        "🔹 *Conta da Casa*: Gerencie os gastos em casal ou família de forma separada do seu saldo pessoal. 👩‍❤️‍👨 ",
        "",
        "🔹 *Gestão de Projetos*: 'Lança 100 na Obra' ou 'Viagem'. Acompanhe seus grandes sonhos por categoria. ",
        "",
        "🔹 *PF e PJ*: Eu separo automaticamente seus gastos pessoais dos gastos da sua Empresa (PJ). 💼",
        "",
        "🔹 *Tira-Dúvidas*: Eu consigo responder suas dúvidas por áudio ou mensagem. Se precisar de suporte humano, visite nosso Instagram *@contai.ia* e veja o destaque 'Suporte'. 💡",
        "",
        "",
        `📈 *Painel*: Acompanhe seus gráficos e relatórios em tempo real: ${appBaseUrl}/app/dashboard`,
        "",
        "",
        "🛡️ _Seus dados são protegidos com criptografia e total privacidade._",
        "",
        "",
        "*Vamos registrar algo agora?* Me mande um áudio, texto ou a foto de um recibo para começar!",
      ].join("\n");

      return { reply };
    }

    case "ajuda":
      return { reply: getHelpText() };

    default:
      return { reply: "Não entendi tudo ainda. Me manda de um jeito mais direto que eu organizo." };
  }
}


async function checkHouseholdAlerts(identity: Identity) {
  if (identity.household.type === "individual") return "";

  const totalBalance = toAmountNumber(identity.household.totalHouseBalance);
  const monthlyIncome = toAmountNumber(identity.household.monthlyIncome || 0);

  if (monthlyIncome <= 0) return "";

  const remainingPercentage = (totalBalance / monthlyIncome) * 100;

  if (totalBalance < 0) {
    return "\n\n🚨 *Atenção:* a conta da casa ultrapassou o limite disponível.\n👥 *Saldo atual:* " + formatCurrency(totalBalance) + "\nÉ importante revisar os gastos.";
  }

  if (totalBalance === 0) {
    return "\n\n🚨 *Atenção:* o saldo da casa acabou.\n👥 *Poupem os próximos gastos.*";
  }

  if (remainingPercentage <= 20) {
    return "\n\n⚠️ *Atenção:* a conta da casa já usou mais de 80% do saldo.\n👥 *Saldo total restante:* " + formatCurrency(totalBalance) + "\nFiquem atentos aos próximos gastos.";
  }

  return "";
}

async function checkBudgetLimits(identity: Identity, amount: number, categoryName: string) {
  let budgetAlert = "";
  try {
    const start = startOfMonth(undefined, identity.user.timezone);
    const end = endOfMonth(undefined, identity.user.timezone);
    const now = toZonedTime(new Date(), identity.user.timezone);
    const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const currentDayOfMonth = now.getDate();

    const [category] = await db
      .select()
      .from(categoriesTable)
      .where(
        and(
          eq(categoriesTable.householdId, identity.household.id),
          eq(categoriesTable.name, categoryName)
        )
      )
      .limit(1);

    if (category && category.monthlyLimit) {
      const limit = Number(category.monthlyLimit);
      const [sumResult] = await db
        .select({ total: sql<number>`sum(amount)::float` })
        .from(transactionsTable)
        .where(
          and(
            eq(transactionsTable.householdId, identity.household.id),
            eq(transactionsTable.category, categoryName),
            eq(transactionsTable.status, "paid"),
            gte(transactionsTable.transactionDate, start),
            lte(transactionsTable.transactionDate, end)
          )
        );

      const currentTotal = (sumResult?.total ?? 0) + (amount > 0 ? amount : 0);
      const percentage = (currentTotal / limit) * 100;

      // Cálculo de Velocidade de Gasto (Proativo)
      // v = Gasto Total / Dias Decorridos
      const dailyVelocity = currentTotal / currentDayOfMonth;
      const projectedTotal = dailyVelocity * daysInCurrentMonth;
      const isProjectedToExceed = projectedTotal > limit;
      const daysUntilLimit = Math.max(0, Math.floor((limit - currentTotal) / dailyVelocity));

      if (percentage >= 100) {
        budgetAlert = `\n\n🚨 *Limite Atingido!* Você ultrapassou seu orçamento de ${categoryName} para este mês.`;
      } else if (isProjectedToExceed && currentDayOfMonth >= 5) {
        // Alerta proativo apenas após alguns dias de amostragem (atrito zero, valor real)
        budgetAlert = `\n\n⚠️ *Alerta de Velocidade:* Notei que você está gastando *${categoryName}* mais rápido que o planejado. No ritmo atual, seu orçamento de ${formatCurrency(limit)} acabará em aproximadamente *${daysUntilLimit} dias* (antes do fim do mês).`;
      } else if (percentage >= 80) {
        budgetAlert = `\n\n⚠️ *Atenção:* Você já usou ${Math.round(percentage)}% do seu orçamento de ${categoryName} (${formatCurrency(currentTotal)} de ${formatCurrency(limit)}).`;
      }
    }
  } catch (e) {
    console.error("Error checking budget:", e);
  }
  return budgetAlert;
}

export async function previewBotMessage(input: {
  scenario: BotPreviewScenario;
  phone: string;
  content: string;
  source: string;
  messageType: MessageKind;
  identity: Identity;
}, options: { previewOnly?: boolean } = {}) {
  const { scenario, identity } = input;
  let reply = "";
  const tz = identity.user.timezone;
  const parsedBatch = await interpretMessage(input.content, identity, tz);
  const parsed = parsedBatch[0] || { intent: "indefinido" };
  
  const result = await saveParsedAction(identity, parsed, {
    phone: input.phone,
    content: input.content,
    source: input.source,
    messageType: input.messageType,
  }, { previewOnly: true });
  
  reply = result.reply;

  if (parsed.intent === "registrar_gasto" && parsed.amount) {
     const alert = await checkBudgetLimits(identity, parsed.amount, parsed.category || "Outros");
     reply += alert;
  }

  reply = await applyReplyPrompt(reply, identity);
  return { scenario, blocked: false, parsed, reply };
}

export async function validateBotPreview(input: { userId: number; message: string; messageType?: MessageKind; scenarioOverride?: BotPreviewScenario }) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, input.userId)).limit(1);
  if (!user) {
    return { scenario: "unregistered" as BotPreviewScenario, blocked: true, parsed: { intent: "ajuda" as ParsedIntent }, reply: buildUnregisteredReply() };
  }
  const scenario: BotPreviewScenario = input.scenarioOverride ?? (user.billingStatus === "active" ? "active" : "inactive_plan");
  const identity = await getIdentityByUserId(input.userId);
  if (!identity) return { scenario: "unregistered" as BotPreviewScenario, blocked: true, parsed: { intent: "ajuda" as ParsedIntent }, reply: buildUnregisteredReply() };
  
  return previewBotMessage({ ...input, scenario, identity, phone: identity.user.phone, content: input.message, source: "admin-preview", messageType: input.messageType ?? "text" });
}

export async function processIncomingMessage(input: ProcessIncomingMessageInput) {
  let finalContentForPendency = input.content;
  const access = await validateBotAccess(input.phone);

  if (!access.ok) {
    await logConversation({
      householdId: null,
      memberId: null,
      userId: null,
      originalContent: finalContentForPendency,
      content: input.content,
      intent: access.intent,
      direction: "inbound",
      source: input.source,
      messageType: input.messageType,
      structuredData: {
        blocked: true,
        reason: "access_not_allowed",
        phone: input.phone,
      },
    });

    const accessReply = await applyReplyPrompt(access.reply, access.identity!);

    await logConversation({
      householdId: null,
      memberId: null,
      userId: null,
      originalContent: accessReply,
      content: accessReply,
      intent: access.intent,
      direction: "outbound",
      source: input.source,
      messageType: "text",
      structuredData: {
        blocked: true,
        reason: "access_not_allowed",
      },
    });

    return { user: null, member: null, household: null, subscription: null, parsed: { intent: access.intent }, reply: accessReply };
  }

  const identity = access.identity!;
  
  // V5: Provisionamento Automático de Contas (Sempre verifica se existem contas)
  await ensureDefaultAccounts(identity.household.id, identity.user.id);
  const pendingDecision = await getPendingDecision(identity);

  let parsed: ParsedMessage = { intent: "indefinido" };
  let reply = "";
  let isMissingInfo: boolean | undefined = false;
  let didBypassAI = false;
  let triggerHighValueConfirmation = false;
  let triggerFiscalClarification = false;
  let triggerAccountTypeClarification = false;

  if (pendingDecision && pendingDecision.question) {
    if (checkEscapeCommand(input.content)) {
      await clearPendingDecision(pendingDecision.id);
      const rep = await applyReplyPrompt("✅ Operação cancelada! Tudo bem, esqueci o último registro. O que quer fazer?", identity);
      return { user: identity.user, member: identity.member, household: identity.household, subscription: identity.subscription, parsed: { intent: "indefinido" }, reply: rep || "Operação cancelada." };
    }

    if (pendingDecision.kind !== "missing_info") {
       // Support old behaviors for unstructured things if any
       await clearPendingDecision(pendingDecision.id);
    } else {
       // Let's hook the explicit structure!
       didBypassAI = true;
       const actionType = (pendingDecision.payload as any).action || "register_expense";
       const structPending = { ...pendingDecision, action: actionType };

       const ctxResponse = await processContextualResponse(identity as any, input.content, structPending);
       
       if (!ctxResponse.resolved) {
          return { user: identity.user, member: identity.member, household: identity.household, subscription: identity.subscription, parsed: { intent: "indefinido" }, reply: ctxResponse.reply || "Não consegui processar." };
       }

       await clearPendingDecision(pendingDecision.id);
       
       if (actionType === "confirm_high_value") {
          if (ctxResponse.parsedData.confirmed === true) {
             parsed = { ...(pendingDecision.payload as any).transactionParsed };
             const result = await saveParsedAction(identity, parsed, input, { confirmedHighValue: true });
             reply = result.reply;
             isMissingInfo = result.isMissingInfo;
             triggerHighValueConfirmation = result.triggerHighValueConfirmation ?? false;
             triggerFiscalClarification = result.triggerFiscalClarification ?? false;
          } else {
             return { user: identity.user, member: identity.member, household: identity.household, subscription: identity.subscription, parsed: { intent: "indefinido" }, reply: "Lançamento cancelado. Se quiser anotar outra coisa, me mande!" };
          }
       } else if (actionType === "clarify_context") {
          const resultValue = ctxResponse.parsedData.fiscalContextResult;
          parsed = { ...(pendingDecision.payload as any).transactionParsed };
          
          if (resultValue === 'business') {
             parsed.fiscalContext = 'business';
             parsed.visibility = 'personal';
             parsed.accountType = 'personal';
          } else if (resultValue === 'shared') {
             parsed.fiscalContext = 'personal';
             parsed.visibility = 'shared';
             parsed.accountType = 'house';
          } else {
             parsed.fiscalContext = 'personal';
             parsed.visibility = 'personal';
             parsed.accountType = 'personal';
          }

          const saveResult = await saveParsedAction(identity, parsed, input, { confirmedHighValue: true });
          reply = saveResult.reply;
          isMissingInfo = saveResult.isMissingInfo;
          triggerHighValueConfirmation = saveResult.triggerHighValueConfirmation ?? false;
          triggerFiscalClarification = saveResult.triggerFiscalClarification ?? false;
       } else if (actionType === "clarify_account_type") {
          const accountTypeResult = ctxResponse.parsedData.accountTypeResult;
          parsed = { ...(pendingDecision.payload as any).transactionParsed };
          
          if (accountTypeResult === 'house') {
             parsed.accountType = 'house';
             parsed.visibility = 'shared';
          } else {
             parsed.accountType = 'personal';
             parsed.visibility = 'personal';
          }

          const saveResult = await saveParsedAction(identity, parsed, input, { confirmedHighValue: true });
          reply = saveResult.reply;
          isMissingInfo = saveResult.isMissingInfo;
          triggerHighValueConfirmation = saveResult.triggerHighValueConfirmation ?? false;
          triggerFiscalClarification = saveResult.triggerFiscalClarification ?? false;
          triggerAccountTypeClarification = saveResult.triggerAccountTypeClarification ?? false;
       } else {
          const intent = actionType === "register_expense" ? "registrar_gasto" : "registrar_receita";
          parsed = {
              intent: intent,
              ...ctxResponse.parsedData
          };
          const result = await saveParsedAction(identity, parsed, input);
          reply = result.reply;
          isMissingInfo = result.isMissingInfo;
          triggerHighValueConfirmation = result.triggerHighValueConfirmation ?? false;
          triggerFiscalClarification = result.triggerFiscalClarification ?? false;
       }
    }
  }

  if (!didBypassAI) {
    let internalParsedBatch: ParsedMessage[] = [];
    
    if (input.extractions && input.extractions.length > 0) {
      // # VISION PRO - Loop de Batch (Inovações Fase 2)
      for (const extr of input.extractions) {
        const p = mapAIResultToParsed(extr.extracted, identity.user.timezone);
        p.paymentMethod = detectPaymentMethod(extr.normalizedText);
        internalParsedBatch.push(p);
      }
    } else {
      internalParsedBatch = await interpretMessage(input.content, identity);
    }

    let finalReplies: string[] = [];
    let anyMissingInfo = false;

    // Manter referência de parsed para o log de conversas posterior
    parsed = internalParsedBatch[0] || { intent: "indefinido" };

    for (const p of internalParsedBatch) {
      if (needsVisibilityDecision(identity, p, input.content)) {
        if (!anyMissingInfo) {
          anyMissingInfo = true;
          isMissingInfo = true;
          parsed = p;
          const kind = p.intent as any; // Cast to bypass strict PendingKind if needed, or use p.intent
          const qReply = await applyReplyPrompt(replyForPendingQuestion(kind), identity);
          reply = qReply || replyForPendingQuestion(kind);
        } else {
          finalReplies.push(`⚠️ Ignorei um lançamento porque faltaram dados que não consigo tratar agora.`);
        }
        continue;
      }

      if (p.intent === "indefinido" || p.intent === "ajuda") {
        if (parsedBatch.length === 1) {
          const { reply: faqReply } = await answerFAQWithOpenAI(input.content, identity.user.name);
          finalReplies.push(faqReply || getHelpText());
          parsed = p;
        }
        continue;
      }

      // Processamento Core da Transação Única do Loop
      const result = await saveParsedAction(identity, p, input);
      if (result.isMissingInfo) {
        if (!anyMissingInfo) {
          anyMissingInfo = true;
          isMissingInfo = true;
          triggerHighValueConfirmation = result.triggerHighValueConfirmation ?? false;
          triggerFiscalClarification = result.triggerFiscalClarification ?? false;
          triggerAccountTypeClarification = result.triggerAccountTypeClarification ?? false;
          parsed = p;
          reply = result.reply;
        } else {
          finalReplies.push(`⚠️ Tive que descartar o registro de '${p.description || p.category}' porque faltaram dados. Mande ele separado depois!`);
        }
      } else {
        finalReplies.push(result.reply);
        parsed = p; // Atualiza para assegurar log da última ação exitosa
      }
    }

    if (anyMissingInfo && reply) {
      finalReplies.push(`❗ *${reply}*`);
    }

    reply = finalReplies.length > 0 ? finalReplies.join("\n\n---\n\n") : reply;
  }

  if (isMissingInfo) {
    let actionStr = triggerHighValueConfirmation ? "confirm_high_value" : (parsed.intent === "registrar_gasto" ? "register_expense" : "register_income");
    if (triggerFiscalClarification) actionStr = "clarify_context";
    if (triggerAccountTypeClarification) actionStr = "clarify_account_type";

    const flow = (triggerHighValueConfirmation || triggerFiscalClarification || triggerAccountTypeClarification) ? { step: 0, accumulatedData: {} } : initializeFlowState(actionStr, parsed);
    const pendPayload: any = {
      parsed,
      originalContent: finalContentForPendency,
      source: input.source,
      messageType: input.messageType,
      action: actionStr
    };
    if (triggerHighValueConfirmation || triggerFiscalClarification || triggerAccountTypeClarification) pendPayload.transactionParsed = parsed;
    
    await createPendingDecision(identity, "missing_info", reply, pendPayload, flow.step, flow.accumulatedData);
  }

  if (
    parsed.intent !== "saudacao" &&
    parsed.intent !== "ajuda" &&
    parsed.intent !== "indefinido"
  ) {
    await markReferralActiveFromRealUse(identity.user.id);
  }

  await logConversation({
    householdId: identity.household?.id,
    memberId: identity.member?.id,
    userId: identity.user.id,
    originalContent: input.content,
    content: input.content,
    intent: parsed.intent,
    direction: "inbound",
    source: input.source,
    messageType: input.messageType,
    structuredData: parsed,
  });

  const onboardingPhrases = ["acabei de me cadastrar", "como funciona", "primeira vez", "ajuda"];
  const isOnboardingMessage = onboardingPhrases.some(phrase => input.content.toLowerCase().includes(phrase));

  const [existingLog] = await db
    .select({ id: conversationLogsTable.id })
    .from(conversationLogsTable)
    .where(
      and(
        eq(conversationLogsTable.userId, identity.user.id),
        eq(conversationLogsTable.direction, "outbound")
      )
    )
    .limit(1);

  const isFirstTime = !existingLog || isOnboardingMessage;

  reply = await applyReplyPrompt(reply, identity);

  // Regra do Maicon: Alerta em QUALQUER mensagem se a conta da casa estiver em risco
  const houseAlert = await checkHouseholdAlerts(identity);
  if (houseAlert) {
    reply += houseAlert;
  }

  if (isFirstTime) {
    const firstName = getFirstName(identity.user.name);
    const welcomePrefix = [
      `Fala, ${firstName}! 👋`,
      "Eu sou o Contai, seu assistente financeiro aqui no WhatsApp.",
      "",
      "Aqui você controla tudo só conversando comigo — gastos, ganhos, contas da casa e até compromissos.",
      "",
      "💰 Registro automático do que você gasta e recebe",
      "🏠 Separo o que é seu e o que é da casa",
      "📊 Te mostro quanto ainda pode gastar",
      "🚨 Te aviso se você for estourar o orçamento da casa",
      "🎯 Dica de Metas: Defina limites pessoais mensais para não perder o controle! Mande: 'Criar meta de 500 para Mercado'.",
      "",
      "Pode começar do jeito mais simples:",
      "",
      "👉 “Gastei 50 no mercado”",
      "👉 “Recebi 1200 hoje”",
      "👉 “Quanto posso gastar?”",
      "",
      "Se faltar alguma informação, eu te pergunto 👍",
      "",
      "🔒 Seus dados pessoais são privados — ninguém vê seus gastos individuais",
      "",
      `Bora organizar isso de verdade, ${firstName}? 🚀`,
      "--------------------------",
      "",
    ].join("\n");
    reply = welcomePrefix + reply;
  }

  await logConversation({
    householdId: identity.household.id,
    memberId: identity.member?.id ?? null,
    userId: identity.user.id,
    originalContent: reply,
    content: reply,
    intent: parsed.intent,
    direction: "outbound",
    source: input.source,
    messageType: "text",
  });

  return { ...identity, parsed, reply };
}

export async function getDashboardData(userId: number) {
  await markReferralActiveFromRealUse(userId);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
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

  const transactions = await db
    .select()
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.householdId, household.id),
        eq(transactionsTable.status, "paid"),
        gte(transactionsTable.transactionDate, startOfMonth(undefined, user.timezone)),
        lte(transactionsTable.transactionDate, endOfMonth(undefined, user.timezone)),
      ),
    )
    .orderBy(desc(transactionsTable.transactionDate));

  const commitments = await db
    .select()
    .from(commitmentsTable)
    .where(
      and(
        eq(commitmentsTable.householdId, household.id),
        gte(commitmentsTable.commitmentDate, startOfDay(undefined, user.timezone)),
      ),
    )
    .orderBy(commitmentsTable.commitmentDate)
    .limit(5);

  const reminders = await db
    .select()
    .from(remindersTable)
    .where(and(eq(remindersTable.householdId, household.id), gte(remindersTable.reminderDate, startOfDay(undefined, user.timezone))))
    .orderBy(remindersTable.reminderDate)
    .limit(5);

  const bills = await db
    .select()
    .from(billsTable)
    .where(and(eq(billsTable.householdId, household.id), gte(billsTable.dueDate, startOfDay(undefined, user.timezone))))
    .orderBy(billsTable.dueDate)
    .limit(5);

  const members = await db
    .select()
    .from(householdMembersTable)
    .where(eq(householdMembersTable.householdId, household.id));

  const income = transactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + toAmountNumber(item.amount), 0);
  const expenses = transactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + toAmountNumber(item.amount), 0);

  const categoryMap = new Map<string, number>();
  for (const item of transactions.filter((row) => row.type === "expense")) {
    categoryMap.set(item.category, (categoryMap.get(item.category) ?? 0) + toAmountNumber(item.amount));
  }

  const byMember = new Map<number, number>();
  for (const item of transactions.filter((row) => row.type === "expense" && row.memberId)) {
    byMember.set(item.memberId!, (byMember.get(item.memberId!) ?? 0) + toAmountNumber(item.amount));
  }

  const [subscription] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.householdId, household.id))
    .orderBy(desc(subscriptionsTable.createdAt))
    .limit(1);

  const [calendarConnection] = await db
    .select()
    .from(googleCalendarConnectionsTable)
    .where(eq(googleCalendarConnectionsTable.userId, user.id))
    .limit(1);

  return {
    user,
    member,
    household,
    balance: income - expenses,
    income,
    expenses,
    transactions: transactions.slice(0, 8),
    commitments,
    reminders,
    bills,
    members,
    byMember: members.map((item) => ({
      memberId: item.id,
      displayName: item.displayName,
      totalExpenses: byMember.get(item.id) ?? 0,
    })),
    todayCommitments: commitments.filter(
      (item) => item.commitmentDate >= startOfDay(undefined, user.timezone) && item.commitmentDate <= endOfDay(undefined, user.timezone),
    ),
    categoryBreakdown: [...categoryMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([category, total]) => ({ category, total })),
    subscription,
    calendarConnection,
  };
}

