import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const PLAN_NAME = "Plano Contai";
const PLAN_MONTHLY_AMOUNT = 14.9;
const PLAN_ANNUAL_AMOUNT = 99.9;
const MEMBER_LIMIT = 2;

export type SystemSettings = {
  planName: string;
  monthlyPlanPrice: number;
  annualPlanPrice: number;
  memberLimit: number;
  billingCycle: string;
  onboardingFlow: string;
  monthlyMessageLimit: number;
  botTone: string;
  botReplyPrompt: string;
  botTextInterpretationPrompt: string;
  botImageInterpretationPrompt: string;
  botHelpText: string;
  botUnregisteredAccessMessage: string;
  botInactivePlanMessage: string;
  botGoogleCalendarRequiredForScheduling: boolean;
  botGoogleCalendarConnectionMessage: string;
  globalCategories: string[];
  googleCalendarEnabled: boolean;
  audioProcessingEnabled: boolean;
  imageProcessingEnabled: boolean;
};

const settingsPath = path.resolve(process.cwd(), ".data", "system-settings.json");

const defaultSystemSettings: SystemSettings = {
  planName: PLAN_NAME,
  monthlyPlanPrice: PLAN_MONTHLY_AMOUNT,
  annualPlanPrice: PLAN_ANNUAL_AMOUNT,
  memberLimit: MEMBER_LIMIT,
  billingCycle: "annual_recommended",
  onboardingFlow: "whatsapp_first",
  monthlyMessageLimit: 1500,
  botTone: "curto, amigavel, brasileiro",
  botReplyPrompt:
    "Responda em portugues do Brasil, de forma curta, clara, humana e confiante. Confirme o que foi registrado, mantenha os dados corretos, nao invente nada e preserve a estrutura objetiva da mensagem.",
  botTextInterpretationPrompt:
    "Priorize entender gastos, receitas, contas, compromissos, lembretes, historico e resumos sem inventar dados.",
  botImageInterpretationPrompt:
    "Priorize comprovantes, recibos, notas fiscais, pix e prints financeiros com foco em valor, categoria e descricao.",
  botHelpText:
    "Posso anotar gastos, receitas, contas e compromissos. Ex.: 'gastei 50 no mercado' ou 'consulta amanha as 14h'.",
  botUnregisteredAccessMessage:
    "Oi! Para usar o Contai no WhatsApp, esse numero precisa estar cadastrado no sistema. Crie sua conta, use esse mesmo numero no cadastro e depois finalize seu plano para liberar o bot.",
  botInactivePlanMessage:
    "Seu numero foi encontrado no Contai, mas o acesso do bot ainda nao esta liberado. Entre no painel, conclua um plano ativo e depois volte aqui no WhatsApp.",
  botGoogleCalendarRequiredForScheduling: true,
  botGoogleCalendarConnectionMessage:
    "Para agendar compromissos no Contai, conecte primeiro o seu Google Agenda. Entre no painel, abra Integracoes e toque em Conectar Google Agenda. Se precisar, faca login pelo link e depois conecte sua agenda.",
  globalCategories: ["Alimentacao", "Mercado", "Transporte", "Moradia", "Contas", "Saude", "Lazer", "Outros"],
  googleCalendarEnabled: true,
  audioProcessingEnabled: true,
  imageProcessingEnabled: true,
};

export const systemSettings: SystemSettings = { ...defaultSystemSettings };

let loaded = false;

async function ensureStore() {
  await mkdir(path.dirname(settingsPath), { recursive: true });
}

async function readStore(): Promise<Partial<SystemSettings>> {
  try {
    const raw = await readFile(settingsPath, "utf8");
    return JSON.parse(raw) as Partial<SystemSettings>;
  } catch {
    return {};
  }
}

async function writeStore(settings: SystemSettings) {
  await ensureStore();
  await writeFile(settingsPath, JSON.stringify(settings, null, 2), "utf8");
}

function normalizeSettings(values: Partial<SystemSettings>): Partial<SystemSettings> {
  return {
    ...values,
    monthlyPlanPrice:
      values.monthlyPlanPrice == null ? undefined : Number(values.monthlyPlanPrice),
    annualPlanPrice:
      values.annualPlanPrice == null ? undefined : Number(values.annualPlanPrice),
    memberLimit: values.memberLimit == null ? undefined : Number(values.memberLimit),
    monthlyMessageLimit:
      values.monthlyMessageLimit == null ? undefined : Number(values.monthlyMessageLimit),
    globalCategories:
      values.globalCategories == null
        ? undefined
        : values.globalCategories.map((item) => String(item).trim()).filter(Boolean),
    botGoogleCalendarRequiredForScheduling:
      values.botGoogleCalendarRequiredForScheduling == null
        ? undefined
        : Boolean(values.botGoogleCalendarRequiredForScheduling),
    googleCalendarEnabled:
      values.googleCalendarEnabled == null ? undefined : Boolean(values.googleCalendarEnabled),
    audioProcessingEnabled:
      values.audioProcessingEnabled == null ? undefined : Boolean(values.audioProcessingEnabled),
    imageProcessingEnabled:
      values.imageProcessingEnabled == null ? undefined : Boolean(values.imageProcessingEnabled),
  };
}

export async function loadSystemSettings() {
  if (loaded) {
    return systemSettings;
  }

  const stored = normalizeSettings(await readStore());
  Object.assign(systemSettings, defaultSystemSettings, stored);
  loaded = true;
  return systemSettings;
}

export async function getSystemSettings() {
  await loadSystemSettings();
  return systemSettings;
}

export async function updateSystemSettings(values: Partial<SystemSettings>) {
  await loadSystemSettings();
  Object.assign(systemSettings, normalizeSettings(values));
  await writeStore(systemSettings);
  return systemSettings;
}
