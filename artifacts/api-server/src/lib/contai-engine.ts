import {
  billsTable,
  categoriesTable,
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
} from "@workspace/db";
import { and, asc, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { interpretTextWithOpenAI, rewriteReplyWithOpenAI, type AIParsedMessage } from "./openai-client";
import {
  getGoogleCalendarStatus,
  syncBillForUser,
  syncCommitmentForUser,
  syncReminderForUser,
} from "./google-calendar";
import { queueNotificationEvent } from "./notifications";
import { expandBrazilPhoneVariants, normalizeBrazilPhone } from "./phone";
import { markReferralActiveFromRealUse } from "./referrals";
import { systemSettings } from "./system-settings";

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
  | "indefinido";

type ProcessIncomingMessageInput = {
  phone: string;
  content: string;
  source?: string;
  messageType?: MessageKind;
  userName?: string;
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
};

type PendingKind = "registrar_gasto" | "registrar_conta" | "registrar_compromisso";
type PendingPayload = {
  parsed: ParsedMessage;
  originalContent: string;
  source?: string;
  messageType?: MessageKind;
};
type Identity = NonNullable<Awaited<ReturnType<typeof getIdentityByPhone>>>;
type BotAccessResult =
  | { ok: true; identity: Identity }
  | { ok: false; reply: string; intent: ParsedIntent };
type SaveParsedActionOptions = {
  previewOnly?: boolean;
  forceGoogleAgendaBlocked?: boolean;
};
export type BotPreviewScenario = "active" | "unregistered" | "inactive_plan" | "google_required";

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

export function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

export function endOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function startOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

export function endOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
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

function detectExplicitVisibility(text: string): Visibility | undefined {
  const normalized = normalizeText(text);
  if (
    normalized.includes("da casa") ||
    normalized.includes("de casa") ||
    normalized.includes("compartilhado") ||
    normalized.includes("compartilhada") ||
    normalized.includes("nosso") ||
    normalized.includes("nossa")
  ) {
    return "shared";
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
    .replace(/\b(no|na|de|do|da|pro|pra)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseDateTime(text: string, now = new Date()) {
  const normalized = normalizeText(text);
  const hourMatch = normalized.match(/(\d{1,2})(?::(\d{2}))?\s*h?/);
  const hour = hourMatch ? Number(hourMatch[1]) : 9;
  const minute = hourMatch?.[2] ? Number(hourMatch[2]) : 0;

  if (normalized.includes("amanha")) {
    const date = new Date(now);
    date.setDate(date.getDate() + 1);
    date.setHours(hour, minute, 0, 0);
    return date;
  }

  if (normalized.includes("hoje")) {
    const date = new Date(now);
    date.setHours(hour, minute, 0, 0);
    return date;
  }

  const weekdayEntry = Object.entries(WEEKDAY_MAP).find(([label]) =>
    normalized.includes(label),
  );
  if (weekdayEntry) {
    const date = new Date(now);
    const distance = (weekdayEntry[1] - date.getDay() + 7) % 7 || 7;
    date.setDate(date.getDate() + distance);
    date.setHours(hour, minute, 0, 0);
    return date;
  }

  const dayOfMonthMatch = normalized.match(/\bdia\s+(\d{1,2})\b/);
  if (dayOfMonthMatch) {
    const date = new Date(now);
    const day = Number(dayOfMonthMatch[1]);
    if (day < date.getDate()) {
      date.setMonth(date.getMonth() + 1);
    }
    date.setDate(day);
    date.setHours(hour, minute, 0, 0);
    return date;
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

function parseMessageByRules(content: string): ParsedMessage {
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
      when: parseDateTime(content),
      visibility: "personal",
    };
  }

  if (normalized.includes("conta") || normalized.includes("boleto") || normalized.includes("vence")) {
    return {
      intent: "registrar_conta",
      title: cleanDescription(content) || "Conta",
      amount: parseAmount(content),
      category: inferCategory(content, "expense"),
      when: parseDateTime(content),
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
      when: parseDateTime(content),
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
    };
  }

  if (normalized.includes("recebi") || normalized.includes("ganhei") || normalized.includes("entrou")) {
    return {
      intent: "registrar_receita",
      amount: parseAmount(content),
      description: cleanDescription(content) || "Entrada",
      category: inferCategory(content, "income"),
      visibility: "personal",
    };
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

function mapAIResultToParsed(ai: AIParsedMessage): ParsedMessage {
  const parsedDate = ai.data ? parseDateTime(ai.data) ?? new Date(ai.data) : undefined;
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
  };
}

async function interpretMessage(content: string) {
  const parsedByRules = parseMessageByRules(content);
  if (hasEnoughRuleConfidence(parsedByRules)) return parsedByRules;

  const aiResult = await interpretTextWithOpenAI(content, new Date().toISOString());
  if (!aiResult) return parsedByRules;

  const parsedByAI = mapAIResultToParsed(aiResult);
  return parsedByAI.intent === "indefinido" ? parsedByRules : parsedByAI;
}

async function applyReplyPrompt(reply: string) {
  const prompt = systemSettings.botReplyPrompt?.trim();
  if (!prompt) {
    return reply;
  }

  const rewritten = await rewriteReplyWithOpenAI(reply, prompt);
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
      "Oi! Para usar o Contai no WhatsApp, esse numero precisa estar cadastrado no sistema.",
    appBaseUrl,
  );

  return [
    baseMessage,
    "",
    "Como liberar seu acesso:",
    "1. Crie sua conta no Contai.",
    "2. Use esse mesmo numero de WhatsApp no cadastro.",
    "3. Entre no plano e conclua o pagamento.",
    "",
    `Cadastre-se aqui: ${appBaseUrl}/cadastro`,
  ].join("\n");
}

function buildInactivePlanReply() {
  const appBaseUrl = getAppBaseUrl();
  const loginUrl = `${appBaseUrl}/login?next=${encodeURIComponent("/app/assinatura")}`;
  const baseMessage = resolveBotTemplateMessage(
    systemSettings.botInactivePlanMessage?.trim() ||
      "Seu numero foi encontrado no Contai, mas o acesso do bot ainda nao esta liberado.",
    appBaseUrl,
  );

  return [
    baseMessage,
    "",
    "Para usar o WhatsApp do Contai, voce precisa concluir um plano ativo.",
    "",
    `Finalize seu plano aqui: ${loginUrl}`,
  ].join("\n");
}

function isSubscriptionActive(identity: Identity) {
  const subscription = identity.subscription;
  if (!subscription) {
    return false;
  }

  const status = String(subscription.status ?? "").trim().toLowerCase();
  if (status !== "active") {
    return false;
  }

  return subscription.endsAt >= new Date();
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

  if (!isSubscriptionActive(identity)) {
    return {
      ok: false,
      intent: "ajuda",
      reply: buildInactivePlanReply(),
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
) {
  const conditions = [
    eq(transactionsTable.householdId, householdId),
    gte(transactionsTable.transactionDate, startOfMonth()),
    lte(transactionsTable.transactionDate, endOfMonth()),
    eq(transactionsTable.type, "expense"),
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
    .orderBy(asc(pendingDecisionsTable.createdAt))
    .limit(1);

  return rows[0] ?? null;
}

async function createPendingDecision(
  identity: Identity,
  kind: PendingKind,
  question: string,
  payload: PendingPayload,
) {
  await db.insert(pendingDecisionsTable).values({
    householdId: identity.household.id,
    memberId: identity.member?.id ?? null,
    userId: identity.user.id,
    kind,
    question,
    payload,
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

async function saveParsedAction(
  identity: Identity,
  parsed: ParsedMessage,
  input: ProcessIncomingMessageInput,
  options: SaveParsedActionOptions = {},
) {
  const previewOnly = options.previewOnly === true;
  const replyDate = new Date();

  if (parsed.intent === "registrar_gasto") {
    if (!parsed.description) return "Foi gasto com o quê?";
    if (!parsed.amount) return "Qual foi o valor?";

    const category = parsed.category ?? "Outros";
    const visibility = parsed.visibility ?? "personal";
    const appBaseUrl = getAppBaseUrl();
    const description = capitalizeLabel(parsed.description);
    const firstName = getFirstName(identity.user.name);

    if (!previewOnly) {
      await db.insert(transactionsTable).values({
        householdId: identity.household.id,
        memberId: identity.member?.id ?? null,
        type: "expense",
        amount: parsed.amount.toFixed(2),
        category,
        description: parsed.description,
        visibility,
        sourceType: input.messageType ?? "text",
        source: input.source ?? DEFAULT_SOURCE,
        transactionDate: replyDate,
        createdBy: identity.member?.displayName ?? identity.user.name,
      });
    }

    return [
      firstName
        ? `Anotei os ${formatCurrency(parsed.amount)} que você gastou com ${parsed.description} hoje, ${firstName}.`
        : `Anotei os ${formatCurrency(parsed.amount)} que você gastou com ${parsed.description} hoje.`,
      "Já deixei tudo organizado para você.",
      "",
      "📋 *Resumo da transação:*",
      "",
      `🧾 *Descrição:* ${description}`,
      `💸 *Valor:* ${formatCurrency(parsed.amount)}`,
      `📂 *Categoria:* ${category}`,
      `📅 *Data:* ${formatFullDate(replyDate)}`,
      "✅ *Status:* Pago",
      visibility === "shared" ? "🏠 *Tipo:* Gasto da casa" : "👤 *Tipo:* Gasto pessoal",
      "",
      previewOnly
        ? "🧪 Isso é um teste do painel do bot. Nenhum dado foi salvo."
        : `📊 Para visualizar mais detalhes e relatórios, acesse: ${appBaseUrl}/app/dashboard`,
      previewOnly ? "" : "Se precisar de algo a mais, é só me chamar.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (parsed.intent === "registrar_receita") {
    if (!parsed.amount) return "Qual foi o valor da entrada?";

    const category = parsed.category ?? "Freela";
    const description = parsed.description ?? "Entrada";
    const appBaseUrl = getAppBaseUrl();
    const firstName = getFirstName(identity.user.name);

    if (!previewOnly) {
      await db.insert(transactionsTable).values({
        householdId: identity.household.id,
        memberId: identity.member?.id ?? null,
        type: "income",
        amount: parsed.amount.toFixed(2),
        category,
        description,
        visibility: "personal",
        sourceType: input.messageType ?? "text",
        source: input.source ?? DEFAULT_SOURCE,
        transactionDate: replyDate,
        createdBy: identity.member?.displayName ?? identity.user.name,
      });
    }

    return [
      firstName
        ? `Anotei os ${formatCurrency(parsed.amount)} que você recebeu hoje, ${firstName}.`
        : `Anotei os ${formatCurrency(parsed.amount)} que você recebeu hoje.`,
      "Já deixei essa entrada organizada para você.",
      "",
      "📋 *Resumo da transação:*",
      "",
      `🧾 *Descrição:* ${capitalizeLabel(description)}`,
      `💰 *Valor:* ${formatCurrency(parsed.amount)}`,
      `📂 *Categoria:* ${category}`,
      `📅 *Data:* ${formatFullDate(replyDate)}`,
      "✅ *Status:* Recebido",
      "",
      previewOnly
        ? "🧪 Isso é um teste do painel do bot. Nenhum dado foi salvo."
        : `📊 Para visualizar mais detalhes e relatórios, acesse: ${appBaseUrl}/app/dashboard`,
      previewOnly ? "" : "Se precisar de algo a mais, é só me chamar.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (parsed.intent === "registrar_conta") {
    if (!parsed.when) return "Que dia vence essa conta?";

    let syncedToGoogle = false;
    if (!previewOnly) {
      const [bill] = await db.insert(billsTable).values({
        householdId: identity.household.id,
        memberId: identity.member?.id ?? null,
        title: parsed.title?.trim() || "Conta",
        amount: parsed.amount ? parsed.amount.toFixed(2) : null,
        category: parsed.category ?? "Contas",
        dueDate: parsed.when,
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

    return `🔔 Conta salva para ${formatShortDate(parsed.when)}.${
      parsed.visibility === "shared" ? " Salvei como conta da casa." : " Salvei como conta pessoal."
    }${syncedToGoogle ? " Também deixei esse vencimento no seu Google Agenda." : ""}${previewOnly ? " Este foi só um teste do painel." : ""}`;
  }

  if (parsed.intent === "registrar_lembrete") {
    if (!parsed.when) return "Que dia você quer que eu te lembre?";

    let syncedToGoogle = false;
    if (!previewOnly) {
      const [reminder] = await db.insert(remindersTable).values({
        householdId: identity.household.id,
        memberId: identity.member?.id ?? null,
        type: "custom",
        title: parsed.title?.trim() || "Lembrete",
        description: parsed.notes ?? null,
        reminderDate: parsed.when,
        reminderTimeLabel: parsed.when.toTimeString().slice(0, 5),
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

    return `⏰ Lembrete salvo para ${formatShortDate(parsed.when)}.${syncedToGoogle ? " Também adicionei no seu Google Agenda." : ""}${previewOnly ? " Este foi só um teste do painel." : ""}`;
  }

  if (parsed.intent === "registrar_compromisso") {
    if (!parsed.when) return "Qual dia e horário eu devo salvar?";

    if (options.forceGoogleAgendaBlocked) {
      return buildGoogleCalendarConnectionReply();
    }

    if (systemSettings.botGoogleCalendarRequiredForScheduling && !previewOnly) {
      const googleStatus = await getGoogleCalendarStatus(identity.user.id);
      if (!googleStatus.canSync) {
        return buildGoogleCalendarConnectionReply();
      }
    }

    let syncedToGoogle = false;
    if (!previewOnly) {
      const [commitment] = await db
        .insert(commitmentsTable)
        .values({
          householdId: identity.household.id,
          memberId: identity.member?.id ?? null,
          title: parsed.title?.trim() || "Compromisso",
          description: null,
          commitmentDate: parsed.when,
          visibility: parsed.visibility ?? "personal",
          reminderEnabled: true,
          reminderMinutesBefore: 60,
          sourceType: input.messageType ?? "text",
          source: input.source ?? DEFAULT_SOURCE,
        })
        .returning();

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
          date: parsed.when.toISOString(),
          googleCalendarConnected: syncedToGoogle,
        },
      });
    }

    return `📅 ${parsed.title?.trim() || "Compromisso"} salvo para ${formatShortDate(parsed.when)}.${
      parsed.visibility === "shared"
        ? " Salvei como compromisso compartilhado."
        : " Salvei como compromisso pessoal."
    }${syncedToGoogle ? " Também adicionei no seu Google Agenda." : ""}${previewOnly ? " Este foi só um teste do painel." : ""}`;
  }

  if (parsed.intent === "consulta_resumo") {
    const summary = await buildMonthlySummary(
      identity.household.id,
      undefined,
      parsed.visibility,
      parsed.visibility === "personal" ? identity.member?.id : undefined,
    );

    if (parsed.visibility === "shared") {
      return `📊 Neste mês vocês gastaram ${formatCurrency(summary.total)}.${
        summary.topCategory ? ` Maior categoria: ${summary.topCategory}.` : ""
      }`;
    }

    return `📊 Neste mês você gastou ${formatCurrency(summary.total)}.${
      summary.topCategory ? ` Maior categoria: ${summary.topCategory}.` : ""
    }`;
  }

  if (parsed.intent === "consulta_categoria") {
    const summary = await buildMonthlySummary(identity.household.id, parsed.category);
    return `📊 Neste mês vocês gastaram ${formatCurrency(summary.total)} com ${parsed.category}.`;
  }

  if (parsed.intent === "consulta_histórico") {
    const rows = await db
      .select()
      .from(transactionsTable)
      .where(eq(transactionsTable.householdId, identity.household.id))
      .orderBy(desc(transactionsTable.transactionDate))
      .limit(4);

    if (rows.length === 0) {
      return "Ainda não achei movimentações por aqui.";
    }

    return rows
      .map(
        (row) =>
          `${row.type === "income" ? "💰" : "💸"} ${formatCurrency(toAmountNumber(row.amount))} • ${row.category}`,
      )
      .join("\n");
  }

  if (parsed.intent === "saudacao") {
    return "Oi! Me fala um gasto, uma entrada ou um compromisso que eu organizo pra você.";
  }

  if (parsed.intent === "ajuda") {
    return getHelpText();
  }

  return "Não entendi tudo ainda. Me manda de um jeito mais direto que eu organizo.";
}


async function checkBudgetLimits(identity: Identity, amount: number, categoryName: string) {
  let budgetAlert = "";
  try {
    const start = startOfMonth();
    const end = endOfMonth();

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
            gte(transactionsTable.transactionDate, start),
            lte(transactionsTable.transactionDate, end)
          )
        );

      const currentTotal = (sumResult?.total ?? 0) + (amount > 0 ? amount : 0);
      const percentage = (currentTotal / limit) * 100;

      if (percentage >= 80 && percentage < 100) {
        budgetAlert = `\n\n⚠️ **Atenção:** Você já gastou ${Math.round(percentage)}% do seu orçamento de ${categoryName} este mês (${formatCurrency(currentTotal)} de ${formatCurrency(limit)}).`;
      } else if (percentage >= 100) {
        budgetAlert = `\n\n🚨 **Limite Atingido!** Você ultrapassou seu orçamento de ${categoryName} para este mês.`;
      }
    }
  } catch (e) {
    console.error("Error checking budget:", e);
  }
  return budgetAlert;
}

export async function previewBotMessage(input: {
  userId: number;
  message: string;
  scenario?: BotPreviewScenario;
  messageType?: MessageKind;
}) {
  const scenario = input.scenario ?? "active";
  if (scenario === "unregistered") {
    const reply = await applyReplyPrompt(buildUnregisteredReply());
    return { scenario, blocked: true, parsed: { intent: "ajuda" as ParsedIntent }, reply };
  }

  const identity = await getIdentityByUserId(input.userId);
  if (!identity) {
     return { scenario: "unregistered", blocked: true, parsed: { intent: "ajuda" }, reply: "Usuário não encontrado." };
  }

  const parsed = await interpretMessage(input.message);
  let reply = await saveParsedAction(identity, parsed, {
    phone: identity.user.phone,
    content: input.message,
    source: "admin-preview",
    messageType: input.messageType ?? "text",
  }, { previewOnly: true });

  if (parsed.intent === "registrar_gasto" && parsed.amount) {
     const alert = await checkBudgetLimits(identity, parsed.amount, parsed.category || "Outros");
     reply += alert;
  }

  reply = await applyReplyPrompt(reply);
  return { scenario, blocked: false, parsed, reply };
}

export async function validateBotPreview(input: { userId: number; message: string; messageType?: MessageKind }) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, input.userId)).limit(1);
  if (!user) {
    return { scenario: "unregistered" as BotPreviewScenario, blocked: true, parsed: { intent: "ajuda" as ParsedIntent }, reply: buildUnregisteredReply() };
  }
  const scenario: BotPreviewScenario = user.billingStatus === "active" ? "active" : "inactive_plan";
  return previewBotMessage({ ...input, scenario });
}

export async function processIncomingMessage(input: ProcessIncomingMessageInput) {
  const access = await validateBotAccess(input.phone);

  if (!access.ok) {
    await logConversation({
      householdId: null,
      memberId: null,
      userId: null,
      originalContent: input.content,
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

    const reply = await applyReplyPrompt(access.reply);

    await logConversation({
      householdId: null,
      memberId: null,
      userId: null,
      originalContent: reply,
      content: reply,
      intent: access.intent,
      direction: "outbound",
      source: input.source,
      messageType: "text",
      structuredData: {
        blocked: true,
        reason: "access_not_allowed",
      },
    });

    return { user: null, member: null, household: null, subscription: null, parsed: { intent: access.intent }, reply };
  }

  const identity = access.identity;
  const pendingDecision = await getPendingDecision(identity);

  let parsed: ParsedMessage;
  let reply: string;

  if (pendingDecision) {
    const chosenVisibility = detectExplicitVisibility(input.content);
    const pendingPayload = pendingDecision.payload as PendingPayload;

    if (!chosenVisibility) {
      parsed = { intent: "indefinido" };
      reply = pendingDecision.question;
    } else {
      parsed = {
        ...pendingPayload.parsed,
        visibility: chosenVisibility,
      };
      await clearPendingDecision(pendingDecision.id);
      reply = await saveParsedAction(identity, parsed, {
        ...input,
        content: pendingPayload.originalContent,
        source: pendingPayload.source ?? input.source,
        messageType: pendingPayload.messageType ?? input.messageType,
      });
    }
  } else {
    parsed = await interpretMessage(input.content);

    if (needsVisibilityDecision(identity, parsed, input.content)) {
      const kind = parsed.intent as PendingKind;
      reply = replyForPendingQuestion(kind);
      await createPendingDecision(identity, kind, reply, {
        parsed,
        originalContent: input.content,
        source: input.source,
        messageType: input.messageType,
      });
    } else {
      reply = await saveParsedAction(identity, parsed, input);
    }
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

  reply = await applyReplyPrompt(reply);

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
        gte(transactionsTable.transactionDate, startOfMonth()),
        lte(transactionsTable.transactionDate, endOfMonth()),
      ),
    )
    .orderBy(desc(transactionsTable.transactionDate));

  const commitments = await db
    .select()
    .from(commitmentsTable)
    .where(
      and(
        eq(commitmentsTable.householdId, household.id),
        gte(commitmentsTable.commitmentDate, startOfDay()),
      ),
    )
    .orderBy(commitmentsTable.commitmentDate)
    .limit(5);

  const reminders = await db
    .select()
    .from(remindersTable)
    .where(and(eq(remindersTable.householdId, household.id), gte(remindersTable.reminderDate, startOfDay())))
    .orderBy(remindersTable.reminderDate)
    .limit(5);

  const bills = await db
    .select()
    .from(billsTable)
    .where(and(eq(billsTable.householdId, household.id), gte(billsTable.dueDate, startOfDay())))
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
      (item) => item.commitmentDate >= startOfDay() && item.commitmentDate <= endOfDay(),
    ),
    categoryBreakdown: [...categoryMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([category, total]) => ({ category, total })),
    subscription,
    calendarConnection,
  };
}

