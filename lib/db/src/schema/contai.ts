import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const householdsTable = pgTable("households", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull().default("individual"),
  ownerUserId: integer("owner_user_id"),
  planType: text("plan_type").notNull().default("annual"),
  billingStatus: text("billing_status").notNull().default("active"),
  monthlyIncome: numeric("monthly_income", { precision: 12, scale: 2 }),
  totalHouseBalance: numeric("total_house_balance", { precision: 12, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const processedWebhooksTable = pgTable("processed_webhooks", {
  messageId: text("message_id").primaryKey(),
  processedAt: timestamp("processed_at").notNull().defaultNow(),
});

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  householdId: integer("household_id").references(() => householdsTable.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  email: text("email"),
  passwordHash: text("password_hash"),
  timezone: text("timezone").notNull().default("America/Sao_Paulo"),
  monthlyReportEmailEnabled: boolean("monthly_report_email_enabled").notNull().default(true),
  role: text("role").notNull().default("owner"),
  planType: text("plan_type").notNull().default("annual"),
  billingStatus: text("billing_status").notNull().default("active"),
  personalBalance: numeric("personal_balance", { precision: 12, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const householdMembersTable = pgTable("household_members", {
  id: serial("id").primaryKey(),
  householdId: integer("household_id").notNull().references(() => householdsTable.id, {
    onDelete: "cascade",
  }),
  userId: integer("user_id").notNull().references(() => usersTable.id, {
    onDelete: "cascade",
  }),
  displayName: text("display_name").notNull(),
  memberType: text("member_type").notNull().default("owner"),
  householdBalance: numeric("household_balance", { precision: 12, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const accountsTable = pgTable("accounts", {
  id: serial("id").primaryKey(),
  householdId: integer("household_id").notNull().references(() => householdsTable.id, {
    onDelete: "cascade",
  }),
  ownerUserId: integer("owner_user_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  type: text("type").notNull().default("checking"),
  isActive: boolean("is_active").notNull().default(true),
  balance: numeric("balance", { precision: 12, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const categoriesTable = pgTable("categories", {
  id: serial("id").primaryKey(),
  householdId: integer("household_id").notNull().references(() => householdsTable.id, {
    onDelete: "cascade",
  }),
  userId: integer("user_id").references(() => usersTable.id, {
    onDelete: "cascade",
  }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  visibility: text("visibility").notNull().default("shared"),
  isDefault: boolean("is_default").notNull().default(false),
  monthlyLimit: numeric("monthly_limit", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  householdId: integer("household_id").notNull().references(() => householdsTable.id, {
    onDelete: "cascade",
  }),
  memberId: integer("member_id").references(() => householdMembersTable.id, {
    onDelete: "set null",
  }),
  type: text("type").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  accountId: integer("account_id").references(() => accountsTable.id, {
    onDelete: "set null",
  }),
  destinationAccountId: integer("destination_account_id").references(() => accountsTable.id, {
    onDelete: "set null",
  }),
  categoryId: integer("category_id").references(() => categoriesTable.id, {
    onDelete: "set null",
  }),
  category: text("category").notNull(),
  description: text("description").notNull(),
  visibility: text("visibility").notNull().default("shared"),
  sourceType: text("source_type").notNull().default("text"),
  recurrenceType: text("recurrence_type"),
  source: text("source").notNull().default("whatsapp"),
  createdBy: text("created_by").default("Titular"),
  accountType: text("account_type").notNull().default("personal"),
  paymentMethod: text("payment_method").notNull().default("pix"),
  status: text("status").notNull().default("paid"),
  reversalReason: text("reversal_reason"),
  canceledAt: timestamp("canceled_at"),
  transactionDate: timestamp("transaction_date").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const billsTable = pgTable("bills", {
  id: serial("id").primaryKey(),
  householdId: integer("household_id").notNull().references(() => householdsTable.id, {
    onDelete: "cascade",
  }),
  memberId: integer("member_id").references(() => householdMembersTable.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }),
  categoryId: integer("category_id").references(() => categoriesTable.id, {
    onDelete: "set null",
  }),
  category: text("category"),
  dueDate: timestamp("due_date").notNull(),
  isRecurring: boolean("is_recurring").notNull().default(false),
  recurrenceRule: text("recurrence_rule"),
  status: text("status").notNull().default("pending"),
  visibility: text("visibility").notNull().default("shared"),
  type: text("type").notNull().default("payable"),
  googleCalendarEventId: text("google_calendar_event_id"),
  sourceType: text("source_type").notNull().default("text"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const commitmentsTable = pgTable("commitments", {
  id: serial("id").primaryKey(),
  householdId: integer("household_id").notNull().references(() => householdsTable.id, {
    onDelete: "cascade",
  }),
  memberId: integer("member_id").references(() => householdMembersTable.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  description: text("description"),
  commitmentDate: timestamp("commitment_date").notNull(),
  visibility: text("visibility").notNull().default("personal"),
  reminderEnabled: boolean("reminder_enabled").notNull().default(true),
  reminderMinutesBefore: integer("reminder_minutes_before").notNull().default(60),
  googleCalendarEventId: text("google_calendar_event_id"),
  sourceType: text("source_type").notNull().default("text"),
  source: text("source").notNull().default("whatsapp"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const remindersTable = pgTable("reminders", {
  id: serial("id").primaryKey(),
  householdId: integer("household_id").notNull().references(() => householdsTable.id, {
    onDelete: "cascade",
  }),
  memberId: integer("member_id").references(() => householdMembersTable.id, {
    onDelete: "set null",
  }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  reminderDate: timestamp("reminder_date").notNull(),
  reminderTimeLabel: text("reminder_time_label"),
  status: text("status").notNull().default("scheduled"),
  googleCalendarEventId: text("google_calendar_event_id"),
  sourceType: text("source_type").notNull().default("text"),
  source: text("source").notNull().default("whatsapp"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const conversationsTable = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, {
    onDelete: "cascade",
  }),
  householdId: integer("household_id").notNull().references(() => householdsTable.id, {
    onDelete: "cascade",
  }),
  status: text("status").notNull().default("active"),
  channel: text("channel").notNull().default("whatsapp"),
  contextData: text("context_data"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const conversationLogsTable = pgTable("conversation_logs", {
  id: serial("id").primaryKey(),
  householdId: integer("household_id").references(() => householdsTable.id, {
    onDelete: "set null",
  }),
  memberId: integer("member_id").references(() => householdMembersTable.id, {
    onDelete: "set null",
  }),
  userId: integer("user_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  sourceType: text("source_type").notNull().default("text"),
  originalContent: text("original_content").notNull(),
  transcribedContent: text("transcribed_content"),
  imageAnalysis: jsonb("image_analysis"),
  content: text("content").notNull(),
  intent: text("intent").notNull().default("indefinido"),
  direction: text("direction").notNull().default("inbound"),
  source: text("source").notNull().default("whatsapp"),
  messageType: text("message_type").notNull(),
  structuredData: jsonb("structured_data"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pendingDecisionsTable = pgTable("pending_decisions", {
  id: serial("id").primaryKey(),
  householdId: integer("household_id").notNull().references(() => householdsTable.id, {
    onDelete: "cascade",
  }),
  memberId: integer("member_id").references(() => householdMembersTable.id, {
    onDelete: "cascade",
  }),
  userId: integer("user_id").references(() => usersTable.id, {
    onDelete: "cascade",
  }),
  kind: text("kind").notNull(),
  question: text("question").notNull(),
  payload: jsonb("payload").notNull(),
  step: integer("step").notNull().default(0),
  accumulatedData: jsonb("accumulated_data").notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const aiLogsTable = pgTable("ai_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  householdId: integer("household_id").references(() => householdsTable.id, {
    onDelete: "set null",
  }),
  modelUsed: text("model_used").notNull(),
  promptVersion: text("prompt_version"),
  input: text("input").notNull(),
  output: text("output"),
  tokens: integer("tokens"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const subscriptionsTable = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  householdId: integer("household_id").notNull().references(() => householdsTable.id, {
    onDelete: "cascade",
  }),
  planName: text("plan_name").notNull(),
  cycle: text("cycle").notNull().default("annual"),
  paymentMethod: text("payment_method").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull(),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  endsAt: timestamp("ends_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const googleCalendarConnectionsTable = pgTable("google_calendar_connections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, {
    onDelete: "cascade",
  }),
  googleEmail: text("google_email"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  status: text("status").notNull().default("disconnected"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const notificationEventsTable = pgTable("notification_events", {
  id: serial("id").primaryKey(),
  householdId: integer("household_id").references(() => householdsTable.id, {
    onDelete: "set null",
  }),
  userId: integer("user_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  type: text("type").notNull(),
  channel: text("channel").notNull().default("email"),
  recipient: text("recipient"),
  subject: text("subject").notNull(),
  payload: jsonb("payload"),
  status: text("status").notNull().default("queued"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const referralCampaignsTable = pgTable("referral_campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  prizeTitle: text("prize_title").notNull().default("iPhone"),
  slug: text("slug").notNull(),
  status: text("status").notNull().default("active"),
  startsAt: timestamp("starts_at").notNull().defaultNow(),
  endsAt: timestamp("ends_at"),
  activePoints: integer("active_points").notNull().default(1),
  paidPoints: integer("paid_points").notNull().default(3),
  tiebreakerRule: text("tiebreaker_rule").notNull().default("paid_first_then_created_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const referralsTable = pgTable("referrals", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => referralCampaignsTable.id, {
    onDelete: "set null",
  }),
  referrerUserId: integer("referrer_user_id").notNull().references(() => usersTable.id, {
    onDelete: "cascade",
  }),
  referredUserId: integer("referred_user_id").notNull().references(() => usersTable.id, {
    onDelete: "cascade",
  }),
  referralCode: text("referral_code").notNull(),
  status: text("status").notNull().default("entered"),
  activePointsAwarded: integer("active_points_awarded").notNull().default(0),
  paidPointsAwarded: integer("paid_points_awarded").notNull().default(0),
  activatedAt: timestamp("activated_at"),
  paidAt: timestamp("paid_at"),
  disqualifiedReason: text("disqualified_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const referralEventsTable = pgTable("referral_events", {
  id: serial("id").primaryKey(),
  referralId: integer("referral_id").notNull().references(() => referralsTable.id, {
    onDelete: "cascade",
  }),
  type: text("type").notNull(),
  detail: text("detail"),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const adminAuditLogsTable = pgTable("admin_audit_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  action: text("action").notNull(),
  details: jsonb("details"),
  ip: text("ip"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({
  id: true,
  createdAt: true,
});
export const insertCommitmentSchema = createInsertSchema(commitmentsTable).omit({
  id: true,
  createdAt: true,
});
export const insertReminderSchema = createInsertSchema(remindersTable).omit({
  id: true,
  createdAt: true,
});
export const insertConversationLogSchema = createInsertSchema(conversationLogsTable).omit({
  id: true,
  createdAt: true,
});
export const insertSubscriptionSchema = createInsertSchema(subscriptionsTable).omit({
  id: true,
  createdAt: true,
});

export type Household = typeof householdsTable.$inferSelect;
export type User = typeof usersTable.$inferSelect;
export type HouseholdMember = typeof householdMembersTable.$inferSelect;
export type Transaction = typeof transactionsTable.$inferSelect;
export type Bill = typeof billsTable.$inferSelect;
export type Commitment = typeof commitmentsTable.$inferSelect;
export type Reminder = typeof remindersTable.$inferSelect;
export type Conversation = typeof conversationsTable.$inferSelect;
export type ConversationLog = typeof conversationLogsTable.$inferSelect;
export type PendingDecision = typeof pendingDecisionsTable.$inferSelect;
export type Subscription = typeof subscriptionsTable.$inferSelect;
export type Category = typeof categoriesTable.$inferSelect;
export type GoogleCalendarConnection =
  typeof googleCalendarConnectionsTable.$inferSelect;
export type NotificationEvent = typeof notificationEventsTable.$inferSelect;
export type ReferralCampaign = typeof referralCampaignsTable.$inferSelect;
export type Referral = typeof referralsTable.$inferSelect;
export type ReferralEvent = typeof referralEventsTable.$inferSelect;
export type AdminAuditLog = typeof adminAuditLogsTable.$inferSelect;
export type ProcessedWebhook = typeof processedWebhooksTable.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertCommitment = z.infer<typeof insertCommitmentSchema>;
export type InsertReminder = z.infer<typeof insertReminderSchema>;
export type InsertConversationLog = z.infer<typeof insertConversationLogSchema>;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export function toAmountNumber(value: string | number | null): number {
  if (value == null) {
    return 0;
  }
  return typeof value === "number" ? value : Number(value);
}
