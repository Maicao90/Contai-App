import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type IntegrationKey =
  | "whatsapp"
  | "openai"
  | "gemini"
  | "google-calendar"
  | "cakto"
  | "utmify"
  | "email"
  | "supabase";

type HistoryItem = {
  status: string;
  message: string;
  at: string;
  latencyMs?: number | null;
  response?: string | null;
};

type Store = {
  secrets: Record<string, string>;
  history: Partial<Record<IntegrationKey, HistoryItem[]>>;
};

const storePath = path.resolve(process.cwd(), ".data", "integration-secrets.json");

const integrationFields: Record<IntegrationKey, string[]> = {
  whatsapp: ["META_ACCESS_TOKEN", "META_PHONE_NUMBER_ID", "META_WEBHOOK_VERIFY_TOKEN", "META_GRAPH_VERSION"],
  openai: ["OPENAI_API_KEY", "OPENAI_CHAT_MODEL", "OPENAI_VISION_MODEL", "OPENAI_TRANSCRIBE_MODEL"],
  gemini: ["GEMINI_API_KEY"],
  "google-calendar": ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URI"],
  cakto: [
    "CAKTO_API_TOKEN",
    "CAKTO_WEBHOOK_SECRET",
    "CAKTO_CHECKOUT_BASE_URL",
    "CAKTO_PRODUCT_MONTHLY_ID",
    "CAKTO_PRODUCT_ANNUAL_ID",
  ],
  utmify: ["UTMIFY_API_TOKEN", "UTMIFY_BASE_URL", "UTMIFY_PROJECT_ID", "UTMIFY_WEBHOOK_SECRET"],
  email: ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "SMTP_FROM_EMAIL", "SMTP_FROM_NAME"],
  supabase: ["DATABASE_URL", "SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
};

async function ensureStore() {
  await mkdir(path.dirname(storePath), { recursive: true });
}

async function readStore(): Promise<Store> {
  try {
    const raw = await readFile(storePath, "utf8");
    const parsed = JSON.parse(raw) as Store;
    return {
      secrets: parsed.secrets ?? {},
      history: parsed.history ?? {},
    };
  } catch {
    return { secrets: {}, history: {} };
  }
}

async function writeStore(store: Store) {
  await ensureStore();
  await writeFile(storePath, JSON.stringify(store, null, 2), "utf8");
}

export async function loadIntegrationSecretsIntoEnv() {
  const store = await readStore();
  for (const [key, value] of Object.entries(store.secrets)) {
    if (value) {
      process.env[key] = value;
    }
  }
}

export function getIntegrationFieldKeys(key: IntegrationKey) {
  return integrationFields[key];
}

export async function getIntegrationStoredValues(key: IntegrationKey) {
  const store = await readStore();
  return integrationFields[key].reduce<Record<string, string>>((acc, field) => {
    acc[field] = store.secrets[field] ?? process.env[field] ?? "";
    return acc;
  }, {});
}

export async function saveIntegrationStoredValues(
  key: IntegrationKey,
  values: Record<string, string>,
) {
  const store = await readStore();

  for (const field of integrationFields[key]) {
    const nextValue = String(values[field] ?? "").trim();
    if (nextValue) {
      store.secrets[field] = nextValue;
      process.env[field] = nextValue;
    } else {
      delete store.secrets[field];
      delete process.env[field];
    }
  }

  await writeStore(store);
}

export async function appendIntegrationHistory(key: IntegrationKey, item: HistoryItem) {
  const store = await readStore();
  const current = store.history[key] ?? [];
  store.history[key] = [item, ...current].slice(0, 20);
  await writeStore(store);
}

export async function getIntegrationHistory(key: IntegrationKey) {
  const store = await readStore();
  return store.history[key] ?? [];
}
