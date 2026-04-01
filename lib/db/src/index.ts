import path from "node:path";
import { mkdir } from "node:fs/promises";
import { drizzle as drizzleNodePostgres } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { eq, sql } from "drizzle-orm";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
import { scryptSync } from "node:crypto";
import * as schema from "./schema";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL?.trim();
const pgliteDataDir = process.env.PGLITE_DATA_DIR?.trim()
  ? path.resolve(process.env.PGLITE_DATA_DIR)
  : path.resolve(process.cwd(), ".data", "contai-db");

if (!databaseUrl) {
  await mkdir(path.dirname(pgliteDataDir), { recursive: true });
}

const pool = databaseUrl ? new Pool({ connectionString: databaseUrl }) : null;
const pglite = databaseUrl ? null : new PGlite(pgliteDataDir);

export const databaseProvider = databaseUrl ? "postgres" : "pglite";
export const databaseLocation = databaseUrl ?? pgliteDataDir;

export const db = pool
  ? drizzleNodePostgres(pool, { schema })
  : drizzlePglite(pglite!, { schema });

function hashPassword(password: string) {
  return scryptSync(password, "contai-auth-salt", 64).toString("hex");
}

async function ensureSchema() {
  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS households (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'individual',
      owner_user_id INTEGER,
      plan_type TEXT NOT NULL DEFAULT 'annual',
      billing_status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `));

  await db.execute(sql.raw(`
    ALTER TABLE households ADD COLUMN IF NOT EXISTS monthly_income NUMERIC(12, 2);
  `));

  await db.execute(sql.raw(`
    ALTER TABLE households ADD COLUMN IF NOT EXISTS total_house_balance NUMERIC(12, 2) NOT NULL DEFAULT 0;
  `));

  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      household_id INTEGER REFERENCES households(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      email TEXT,
      password_hash TEXT,
      timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
      monthly_report_email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
      role TEXT NOT NULL DEFAULT 'owner',
      plan_type TEXT NOT NULL DEFAULT 'annual',
      billing_status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `));

  await db.execute(sql.raw(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS password_hash TEXT;
  `));

  await db.execute(sql.raw(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS monthly_report_email_enabled BOOLEAN NOT NULL DEFAULT TRUE;
  `));

  await db.execute(sql.raw(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS personal_balance NUMERIC(12, 2) NOT NULL DEFAULT 0;
  `));

  await db.execute(sql.raw(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS external_id TEXT UNIQUE;
  `));

  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS conversations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'active',
      context_data TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `));

  await db.execute(sql.raw(`
    ALTER TABLE conversations
    ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'whatsapp';
  `));

  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS household_members (
      id SERIAL PRIMARY KEY,
      household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      display_name TEXT NOT NULL,
      member_type TEXT NOT NULL DEFAULT 'owner',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `));

  await db.execute(sql.raw(`
    ALTER TABLE household_members ADD COLUMN IF NOT EXISTS household_balance NUMERIC(12, 2) NOT NULL DEFAULT 0;
  `));

  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      visibility TEXT NOT NULL DEFAULT 'shared',
      is_default BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `));

  await db.execute(sql.raw(`
    ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
  `));

  await db.execute(sql.raw(`
    ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'shared';
  `));

  await db.execute(sql.raw(`
    ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS monthly_limit NUMERIC(12, 2);
  `));

  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      member_id INTEGER REFERENCES household_members(id) ON DELETE SET NULL,
      type TEXT NOT NULL,
      amount NUMERIC(12, 2) NOT NULL,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      visibility TEXT NOT NULL DEFAULT 'shared',
      source_type TEXT NOT NULL DEFAULT 'text',
      recurrence_type TEXT,
      source TEXT NOT NULL DEFAULT 'whatsapp',
      created_by TEXT DEFAULT 'Titular',
      transaction_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `));

  await db.execute(sql.raw(`
    ALTER TABLE transactions ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'personal';
  `));

  await db.execute(sql.raw(`
    ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'pix';
  `));

  await db.execute(sql.raw(`
    ALTER TABLE transactions ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'paid';
  `));

  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS bills (
      id SERIAL PRIMARY KEY,
      household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      member_id INTEGER REFERENCES household_members(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      amount NUMERIC(12, 2),
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      category TEXT,
      due_date TIMESTAMP NOT NULL,
      is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
      recurrence_rule TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      visibility TEXT NOT NULL DEFAULT 'shared',
      type TEXT NOT NULL DEFAULT 'payable',
      google_calendar_event_id TEXT,
      source_type TEXT NOT NULL DEFAULT 'text',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `));

  await db.execute(sql.raw(`
    ALTER TABLE bills
    ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT;
  `));

  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS commitments (
      id SERIAL PRIMARY KEY,
      household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      member_id INTEGER REFERENCES household_members(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      description TEXT,
      commitment_date TIMESTAMP NOT NULL,
      visibility TEXT NOT NULL DEFAULT 'personal',
      reminder_enabled BOOLEAN NOT NULL DEFAULT TRUE,
      reminder_minutes_before INTEGER NOT NULL DEFAULT 60,
      google_calendar_event_id TEXT,
      source_type TEXT NOT NULL DEFAULT 'text',
      source TEXT NOT NULL DEFAULT 'whatsapp',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `));

  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS reminders (
      id SERIAL PRIMARY KEY,
      household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      member_id INTEGER REFERENCES household_members(id) ON DELETE SET NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      reminder_date TIMESTAMP NOT NULL,
      reminder_time_label TEXT,
      status TEXT NOT NULL DEFAULT 'scheduled',
      google_calendar_event_id TEXT,
      source_type TEXT NOT NULL DEFAULT 'text',
      source TEXT NOT NULL DEFAULT 'whatsapp',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `));

  await db.execute(sql.raw(`
    ALTER TABLE reminders
    ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT;
  `));

  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS conversation_logs (
      id SERIAL PRIMARY KEY,
      household_id INTEGER REFERENCES households(id) ON DELETE SET NULL,
      member_id INTEGER REFERENCES household_members(id) ON DELETE SET NULL,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      source_type TEXT NOT NULL DEFAULT 'text',
      original_content TEXT NOT NULL,
      transcribed_content TEXT,
      image_analysis JSONB,
      content TEXT NOT NULL,
      intent TEXT NOT NULL DEFAULT 'indefinido',
      direction TEXT NOT NULL DEFAULT 'inbound',
      source TEXT NOT NULL DEFAULT 'whatsapp',
      message_type TEXT NOT NULL,
      structured_data JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `));

  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS pending_decisions (
      id SERIAL PRIMARY KEY,
      household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      member_id INTEGER REFERENCES household_members(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      kind TEXT NOT NULL,
      question TEXT NOT NULL,
      payload JSONB NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `));

  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id SERIAL PRIMARY KEY,
      household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      plan_name TEXT NOT NULL,
      cycle TEXT NOT NULL DEFAULT 'annual',
      payment_method TEXT NOT NULL,
      amount NUMERIC(10, 2) NOT NULL,
      status TEXT NOT NULL,
      started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      ends_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `));

  await db.execute(sql.raw(`
    ALTER TABLE subscriptions
    ADD COLUMN IF NOT EXISTS cycle TEXT NOT NULL DEFAULT 'annual';
  `));

  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS google_calendar_connections (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      google_email TEXT,
      access_token TEXT,
      refresh_token TEXT,
      status TEXT NOT NULL DEFAULT 'disconnected',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `));

  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS notification_events (
      id SERIAL PRIMARY KEY,
      household_id INTEGER REFERENCES households(id) ON DELETE SET NULL,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      type TEXT NOT NULL,
      channel TEXT NOT NULL DEFAULT 'email',
      recipient TEXT,
      subject TEXT NOT NULL,
      payload JSONB,
      status TEXT NOT NULL DEFAULT 'queued',
      sent_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `));

  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS referral_campaigns (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      prize_title TEXT NOT NULL DEFAULT 'iPhone',
      slug TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      starts_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      ends_at TIMESTAMP,
      active_points INTEGER NOT NULL DEFAULT 1,
      paid_points INTEGER NOT NULL DEFAULT 3,
      tiebreaker_rule TEXT NOT NULL DEFAULT 'paid_first_then_created_at',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `));

  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS referrals (
      id SERIAL PRIMARY KEY,
      campaign_id INTEGER REFERENCES referral_campaigns(id) ON DELETE SET NULL,
      referrer_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      referred_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      referral_code TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'entered',
      active_points_awarded INTEGER NOT NULL DEFAULT 0,
      paid_points_awarded INTEGER NOT NULL DEFAULT 0,
      activated_at TIMESTAMP,
      paid_at TIMESTAMP,
      disqualified_reason TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `));

  await db.execute(sql.raw(`
    CREATE UNIQUE INDEX IF NOT EXISTS referrals_referred_user_unique
    ON referrals (referred_user_id);
  `));

  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS referral_events (
      id SERIAL PRIMARY KEY,
      referral_id INTEGER NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      detail TEXT,
      payload JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `));

  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS admin_audit_logs (
      id SERIAL PRIMARY KEY,
      admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      details JSONB,
      ip TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `));
}

async function seedDevelopmentData() {
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(
    schema.usersTable,
  );

  if (count > 0) {
    return;
  }

  const [household] = await db
    .insert(schema.householdsTable)
    .values({
      name: "Casa Camila & Rafa",
      type: "couple",
      planType: "annual",
      billingStatus: "active",
    })
    .returning();

  const [camila] = await db
    .insert(schema.usersTable)
    .values({
      householdId: household.id,
      name: "Camila Rocha",
      phone: "5511999990001",
      email: "camila@contai.app",
      passwordHash: hashPassword("contai123"),
      timezone: "America/Sao_Paulo",
      role: "owner",
      planType: "annual",
      billingStatus: "active",
    })
    .returning();

  const [rafa] = await db
    .insert(schema.usersTable)
    .values({
      householdId: household.id,
      name: "Rafael Rocha",
      phone: "5511999990002",
      email: "rafa@contai.app",
      passwordHash: hashPassword("contai123"),
      timezone: "America/Sao_Paulo",
      role: "partner",
      planType: "annual",
      billingStatus: "active",
    })
    .returning();

  const [camilaMember] = await db
    .insert(schema.householdMembersTable)
    .values({
      householdId: household.id,
      userId: camila.id,
      displayName: "Camila",
      memberType: "owner",
    })
    .returning();

  const [rafaMember] = await db
    .insert(schema.householdMembersTable)
    .values({
      householdId: household.id,
      userId: rafa.id,
      displayName: "Rafa",
      memberType: "partner",
    })
    .returning();

  await db.execute(
    sql.raw(`UPDATE households SET owner_user_id = ${camila.id} WHERE id = ${household.id}`),
  );

  const categoryNames = [
    "Alimentação",
    "Mercado",
    "Transporte",
    "Combustível",
    "Moradia",
    "Aluguel",
    "Contas",
    "Água",
    "Luz",
    "Internet",
    "Saúde",
    "Farmácia",
    "Educação",
    "Lazer",
    "Compras",
    "Assinaturas",
    "Trabalho",
    "Investimentos",
    "Pets",
    "Filhos",
    "Presentes",
    "Viagem",
    "Outros",
    "Salário",
    "Freela",
  ];

  await db.insert(schema.categoriesTable).values(
    categoryNames.map((name) => ({
      householdId: household.id,
      name,
      type: name === "Salário" || name === "Freela" ? "income" : "expense",
      isDefault: true,
    })),
  );

  await db.insert(schema.transactionsTable).values([
    {
      householdId: household.id,
      memberId: camilaMember.id,
      type: "income",
      amount: "5800.00",
      category: "Salário",
      description: "Salário principal",
      visibility: "shared",
      sourceType: "text",
      transactionDate: new Date("2026-03-01T09:00:00-03:00"),
      createdBy: "Camila",
    },
    {
      householdId: household.id,
      memberId: camilaMember.id,
      type: "expense",
      amount: "198.40",
      category: "Mercado",
      description: "Compra da casa",
      visibility: "shared",
      sourceType: "text",
      transactionDate: new Date("2026-03-04T12:10:00-03:00"),
      createdBy: "Camila",
    },
    {
      householdId: household.id,
      memberId: rafaMember.id,
      type: "expense",
      amount: "42.00",
      category: "Combustível",
      description: "Posto",
      visibility: "personal",
      sourceType: "text",
      transactionDate: new Date("2026-03-10T08:30:00-03:00"),
      createdBy: "Rafa",
    },
  ]);

  await db.insert(schema.billsTable).values([
    {
      householdId: household.id,
      memberId: camilaMember.id,
      title: "Internet",
      amount: "120.00",
      category: "Internet",
      dueDate: new Date("2026-04-10T09:00:00-03:00"),
      isRecurring: true,
      recurrenceRule: "monthly",
      status: "pending",
      visibility: "shared",
      type: "payable",
      sourceType: "text",
    },
    {
      householdId: household.id,
      memberId: rafaMember.id,
      title: "Cliente Agência",
      amount: "800.00",
      category: "Freela",
      dueDate: new Date("2026-04-20T09:00:00-03:00"),
      isRecurring: false,
      status: "pending",
      visibility: "personal",
      type: "receivable",
      sourceType: "text",
    },
  ]);

  await db.insert(schema.commitmentsTable).values([
    {
      householdId: household.id,
      memberId: camilaMember.id,
      title: "Consulta odontológica",
      description: "Levar exames",
      commitmentDate: new Date("2026-03-27T14:00:00-03:00"),
      visibility: "personal",
      reminderEnabled: true,
      reminderMinutesBefore: 120,
      sourceType: "text",
    },
    {
      householdId: household.id,
      memberId: rafaMember.id,
      title: "Reunião do casal",
      description: "Planejamento da semana",
      commitmentDate: new Date("2026-03-29T20:00:00-03:00"),
      visibility: "shared",
      reminderEnabled: true,
      reminderMinutesBefore: 30,
      sourceType: "text",
    },
  ]);

  await db.insert(schema.remindersTable).values([
    {
      householdId: household.id,
      memberId: camilaMember.id,
      type: "bill",
      title: "Pagar aluguel",
      description: "Conta da casa",
      reminderDate: new Date("2026-04-05T09:00:00-03:00"),
      reminderTimeLabel: "09:00",
      status: "scheduled",
      sourceType: "text",
    },
  ]);

  await db.insert(schema.subscriptionsTable).values({
    householdId: household.id,
    planName: "Plano Contai",
    cycle: "annual",
    paymentMethod: "pix",
    amount: "99.90",
    status: "active",
    startedAt: new Date("2026-03-01T00:00:00-03:00"),
    endsAt: new Date("2027-03-01T00:00:00-03:00"),
  });

  await db.insert(schema.googleCalendarConnectionsTable).values({
    userId: camila.id,
    googleEmail: "camila@gmail.com",
    accessToken: null,
    refreshToken: null,
    status: "disconnected",
  });

  await db.insert(schema.conversationLogsTable).values([
    {
      householdId: household.id,
      memberId: camilaMember.id,
      userId: camila.id,
      sourceType: "text",
      originalContent: "gastei 198,40 no mercado",
      transcribedContent: null,
      imageAnalysis: null,
      content: "gastei 198,40 no mercado",
      intent: "registrar_gasto",
      direction: "inbound",
      source: "whatsapp",
      messageType: "text",
      structuredData: { amount: 198.4, category: "Mercado", visibility: "shared" },
    },
    {
      householdId: household.id,
      memberId: camilaMember.id,
      userId: camila.id,
      sourceType: "text",
      originalContent: "✅ Anotado: R$198,40 em Mercado. Quer salvar como gasto da casa?",
      transcribedContent: null,
      imageAnalysis: null,
      content: "✅ Anotado: R$198,40 em Mercado. Quer salvar como gasto da casa?",
      intent: "registrar_gasto",
      direction: "outbound",
      source: "whatsapp",
      messageType: "text",
      structuredData: null,
    },
  ]);
}

export async function ensurePermanentAdminUser() {
  const adminEmail = "maiconbatn5@gmail.com";
  const adminPhone = "5500000000001";
  const adminPasswordHash = hashPassword("Adenha90@");

  const [existingByEmail] = await db
    .select()
    .from(schema.usersTable)
    .where(eq(schema.usersTable.email, adminEmail))
    .limit(1);

  if (existingByEmail) {
    await db
      .update(schema.usersTable)
      .set({
        name: "Maicon Admin",
        phone: existingByEmail.phone || adminPhone,
        email: adminEmail,
        passwordHash: adminPasswordHash,
        timezone: "America/Sao_Paulo",
        role: "admin",
        planType: "annual",
        billingStatus: "active",
        updatedAt: new Date(),
      })
      .where(eq(schema.usersTable.id, existingByEmail.id));

    return;
  }

  const [existingByPhone] = await db
    .select()
    .from(schema.usersTable)
    .where(eq(schema.usersTable.phone, adminPhone))
    .limit(1);

  if (existingByPhone) {
    await db
      .update(schema.usersTable)
      .set({
        name: "Maicon Admin",
        email: adminEmail,
        passwordHash: adminPasswordHash,
        timezone: "America/Sao_Paulo",
        role: "admin",
        planType: "annual",
        billingStatus: "active",
        updatedAt: new Date(),
      })
      .where(eq(schema.usersTable.id, existingByPhone.id));

    return;
  }

  await db.insert(schema.usersTable).values({
    householdId: null,
    name: "Maicon Admin",
    phone: adminPhone,
    email: adminEmail,
    passwordHash: adminPasswordHash,
    timezone: "America/Sao_Paulo",
    role: "admin",
    planType: "annual",
    billingStatus: "active",
  });
}

export async function ensureDefaultReferralCampaign() {
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.referralCampaignsTable);

  if (count > 0) {
    return;
  }

  await db.insert(schema.referralCampaignsTable).values({
    name: "Campanha inaugural de indicacoes",
    description: "Ranking oficial do Contai para crescimento com usuarios ativos e pagantes.",
    prizeTitle: "iPhone 17 Pro Max",
    slug: "campanha-inaugural",
    status: "active",
    startsAt: new Date(),
    endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    activePoints: 1,
    paidPoints: 3,
    tiebreakerRule: "paid_first_then_created_at",
  });
}

export const dbReady = (async () => {
  await ensureSchema();
  await ensurePermanentAdminUser();
  await ensureDefaultReferralCampaign();
})();

export * from "./schema";
export * from "./schema/contai";
