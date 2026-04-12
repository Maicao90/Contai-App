import { Router } from "express";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import {
  billsTable,
  commitmentsTable,
  db,
  householdMembersTable,
  remindersTable,
  toAmountNumber,
  transactionsTable,
  usersTable,
} from "@workspace/db";
import { getSession, requireAdmin, requireSession } from "../lib/auth";
import { queueNotificationEvent } from "../lib/notifications";

const router = Router();

type ReportUserRow = {
  id: number;
  householdId: number | null;
  name: string;
  phone: string;
  email: string | null;
  monthlyReportEmailEnabled: boolean;
};

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function parseMonth(value?: string) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) {
    return new Date();
  }

  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1, 1, 0, 0, 0, 0);
}

function formatMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function formatCurrencyBr(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function buildMonthlyEmailSummary(input: {
  monthLabel: string;
  income: number;
  expenses: number;
  balance: number;
  incomePJ?: number;
  expensesPJ?: number;
  incomeHouse?: number;
  expensesHouse?: number;
  incomePersonal?: number;
  expensesPersonal?: number;
  topCategory: string | null;
  billsCount: number;
  remindersCount: number;
  commitmentsCount: number;
}) {
  const parts = [
    `📅 Período: ${input.monthLabel}.`,
    `💰 Resumo Geral: Entradas ${formatCurrencyBr(input.income)}, Saídas ${formatCurrencyBr(input.expenses)} (Saldo: ${formatCurrencyBr(input.balance)}).`,
  ];

  const hasPJ = (input.incomePJ || 0) > 0 || (input.expensesPJ || 0) > 0;
  const hasHouse = (input.incomeHouse || 0) > 0 || (input.expensesHouse || 0) > 0;
  const hasPersonal = (input.incomePersonal || 0) > 0 || (input.expensesPersonal || 0) > 0;

  if (hasPJ) {
    parts.push(`💼 Empresa: +${formatCurrencyBr(input.incomePJ || 0)} / -${formatCurrencyBr(input.expensesPJ || 0)}.`);
  }

  if (hasHouse) {
    parts.push(`🏠 Casa: +${formatCurrencyBr(input.incomeHouse || 0)} / -${formatCurrencyBr(input.expensesHouse || 0)}.`);
  }

  if (hasPersonal) {
    parts.push(`👤 Pessoal: +${formatCurrencyBr(input.incomePersonal || 0)} / -${formatCurrencyBr(input.expensesPersonal || 0)}.`);
  }

  if (input.topCategory) {
    parts.push(`📍 Maior gasto em: ${input.topCategory}.`);
  }

  parts.push(
    `✅ Total de ${input.billsCount} conta(s), ${input.remindersCount} lembrete(s) e ${input.commitmentsCount} compromisso(s).`,
  );

  return parts.join(" ");
}

async function getReportUser(userId: number): Promise<ReportUserRow | null> {
  const [user] = await db
    .select({
      id: usersTable.id,
      householdId: usersTable.householdId,
      name: usersTable.name,
      phone: usersTable.phone,
      email: usersTable.email,
      monthlyReportEmailEnabled:
        sql<boolean>`coalesce(monthly_report_email_enabled, true)`.as("monthly_report_email_enabled"),
    })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  return user ?? null;
}

async function listEligibleMonthlyReportUsers(): Promise<ReportUserRow[]> {
  return db
    .select({
      id: usersTable.id,
      householdId: usersTable.householdId,
      name: usersTable.name,
      phone: usersTable.phone,
      email: usersTable.email,
      monthlyReportEmailEnabled:
        sql<boolean>`coalesce(monthly_report_email_enabled, true)`.as("monthly_report_email_enabled"),
    })
    .from(usersTable)
    .where(
      and(
        sql`${usersTable.role} <> 'admin'`,
        sql`${usersTable.email} is not null`,
        sql`coalesce(monthly_report_email_enabled, true) = true`,
      ),
    );
}

async function loadUserReportContext(userId: number) {
  const user = await getReportUser(userId);
  if (!user || !user.householdId) {
    return null;
  }

  const [member] = await db
    .select()
    .from(householdMembersTable)
    .where(eq(householdMembersTable.userId, user.id))
    .limit(1);

  return { user, member };
}

async function buildMonthlyReport(userId: number, monthValue?: string) {
  const context = await loadUserReportContext(userId);
  if (!context) {
    return null;
  }

  const { user, member } = context;
  const periodDate = parseMonth(monthValue);
  const periodStart = startOfMonth(periodDate);
  const periodEnd = endOfMonth(periodDate);

  const transactionFilters = [
    eq(transactionsTable.householdId, user.householdId!),
    gte(transactionsTable.transactionDate, periodStart),
    lte(transactionsTable.transactionDate, periodEnd),
  ];

  const billFilters = [
    eq(billsTable.householdId, user.householdId!),
    gte(billsTable.dueDate, periodStart),
    lte(billsTable.dueDate, periodEnd),
  ];

  const reminderFilters = [
    eq(remindersTable.householdId, user.householdId!),
    gte(remindersTable.reminderDate, periodStart),
    lte(remindersTable.reminderDate, periodEnd),
  ];

  const commitmentFilters = [
    eq(commitmentsTable.householdId, user.householdId!),
    gte(commitmentsTable.commitmentDate, periodStart),
    lte(commitmentsTable.commitmentDate, periodEnd),
  ];

  if (member?.id) {
    transactionFilters.push(eq(transactionsTable.memberId, member.id));
    billFilters.push(sql`(${billsTable.memberId} = ${member.id} OR ${billsTable.memberId} IS NULL)`);
    reminderFilters.push(
      sql`(${remindersTable.memberId} = ${member.id} OR ${remindersTable.memberId} IS NULL)`,
    );
    commitmentFilters.push(
      sql`(${commitmentsTable.memberId} = ${member.id} OR ${commitmentsTable.visibility} = 'shared')`,
    );
  }

  const [transactions, categoryRows, bills, reminders, commitments] = await Promise.all([
    db
      .select()
      .from(transactionsTable)
      .where(and(...transactionFilters))
      .orderBy(desc(transactionsTable.transactionDate)),
    db
      .select({
        category: transactionsTable.category,
        total: sql<string>`coalesce(sum(${transactionsTable.amount}), 0)`,
      })
      .from(transactionsTable)
      .where(and(...transactionFilters, eq(transactionsTable.type, "expense")))
      .groupBy(transactionsTable.category)
      .orderBy(sql`sum(${transactionsTable.amount}) desc`),
    db.select().from(billsTable).where(and(...billFilters)).orderBy(desc(billsTable.dueDate)),
    db
      .select()
      .from(remindersTable)
      .where(and(...reminderFilters))
      .orderBy(desc(remindersTable.reminderDate)),
    db
      .select()
      .from(commitmentsTable)
      .where(and(...commitmentFilters))
      .orderBy(desc(commitmentsTable.commitmentDate)),
  ]);

  const income = transactions
    .filter((row) => row.type === "income")
    .reduce((sum, row) => sum + toAmountNumber(row.amount), 0);
  const expenses = transactions
    .filter((row) => row.type === "expense")
    .reduce((sum, row) => sum + toAmountNumber(row.amount), 0);

  const categoryBreakdown = categoryRows.map((row) => ({
    category: row.category,
    total: toAmountNumber(row.total),
    percent: expenses > 0 ? Math.round((toAmountNumber(row.total) / expenses) * 100) : 0,
  }));

  const topExpenses = transactions
    .filter((row) => row.type === "expense")
    .slice(0, 5)
    .map((row) => ({
      id: row.id,
      description: row.description,
      category: row.category,
      amount: toAmountNumber(row.amount),
      transactionDate: row.transactionDate,
    }));

  return {
    period: {
      key: formatMonthKey(periodDate),
      label: formatMonthLabel(periodDate),
      startsAt: periodStart,
      endsAt: periodEnd,
    },
    metrics: {
      income,
      expenses,
      balance: income - expenses,
      incomePJ: transactions
        .filter((t) => t.fiscalContext === "business" && t.type === "income")
        .reduce((sum, t) => sum + toAmountNumber(t.amount), 0),
      expensesPJ: transactions
        .filter((t) => t.fiscalContext === "business" && t.type === "expense")
        .reduce((sum, t) => sum + toAmountNumber(t.amount), 0),
      incomeHouse: transactions
        .filter((t) => t.visibility === "shared" && t.fiscalContext !== "business" && t.type === "income")
        .reduce((sum, t) => sum + toAmountNumber(t.amount), 0),
      expensesHouse: transactions
        .filter((t) => t.visibility === "shared" && t.fiscalContext !== "business" && t.type === "expense")
        .reduce((sum, t) => sum + toAmountNumber(t.amount), 0),
      incomePersonal: transactions
        .filter((t) => t.visibility === "personal" && t.fiscalContext === "personal" && t.type === "income")
        .reduce((sum, t) => sum + toAmountNumber(t.amount), 0),
      expensesPersonal: transactions
        .filter((t) => t.visibility === "personal" && t.fiscalContext === "personal" && t.type === "expense")
        .reduce((sum, t) => sum + toAmountNumber(t.amount), 0),
      topCategory: categoryBreakdown[0]?.category ?? null,
      transactionsCount: transactions.length,
      billsCount: bills.length,
      remindersCount: reminders.length,
      commitmentsCount: commitments.length,
    },
    categoryBreakdown,
    topExpenses,
    dueBills: bills.slice(0, 5).map((bill) => ({
      id: bill.id,
      title: bill.title,
      amount: bill.amount ? toAmountNumber(bill.amount) : 0,
      dueDate: bill.dueDate,
      status: bill.status,
      type: bill.type,
    })),
    reminders: reminders.slice(0, 5).map((item) => ({
      id: item.id,
      title: item.title,
      reminderDate: item.reminderDate,
      status: item.status,
    })),
    commitments: commitments.slice(0, 5).map((item) => ({
      id: item.id,
      title: item.title,
      commitmentDate: item.commitmentDate,
      visibility: item.visibility,
    })),
    emailPreferences: {
      enabled: user.monthlyReportEmailEnabled,
      email: user.email,
    },
  };
}

function canAccessOwnReport(sessionUserId: number | null, targetUserId: number) {
  return Boolean(sessionUserId && sessionUserId === targetUserId);
}

router.get("/reports/monthly-summary", async (req, res, next) => {
  try {
    const householdId = Number(req.query.householdId ?? 1);
    const rows = await db
      .select()
      .from(transactionsTable)
      .where(
        and(
          eq(transactionsTable.householdId, householdId),
          gte(transactionsTable.transactionDate, startOfMonth()),
          lte(transactionsTable.transactionDate, endOfMonth()),
        ),
      );

    const income = rows
      .filter((row) => row.type === "income")
      .reduce((sum, row) => sum + toAmountNumber(row.amount), 0);
    const expenses = rows
      .filter((row) => row.type === "expense")
      .reduce((sum, row) => sum + toAmountNumber(row.amount), 0);
    const byMemberMap = new Map<number, number>();

    rows
      .filter((row) => row.type === "expense" && row.memberId)
      .forEach((row) => {
        byMemberMap.set(row.memberId!, (byMemberMap.get(row.memberId!) ?? 0) + toAmountNumber(row.amount));
      });

    const members = await db
      .select()
      .from(householdMembersTable)
      .where(eq(householdMembersTable.householdId, householdId));

    const categories = await db
      .select({
        category: transactionsTable.category,
        total: sql<string>`coalesce(sum(${transactionsTable.amount}), 0)`,
      })
      .from(transactionsTable)
      .where(and(eq(transactionsTable.householdId, householdId), eq(transactionsTable.type, "expense")))
      .groupBy(transactionsTable.category)
      .orderBy(sql`sum(${transactionsTable.amount}) desc`);

    res.json({
      income,
      expenses,
      balance: income - expenses,
      topCategory: categories[0]?.category ?? null,
      categoryBreakdown: categories.map((row) => ({
        category: row.category,
        total: toAmountNumber(row.total),
      })),
      byMember: members.map((item) => ({
        memberId: item.id,
        displayName: item.displayName,
        totalExpenses: byMemberMap.get(item.id) ?? 0,
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/reports/today", async (req, res, next) => {
  try {
    const householdId = Number(req.query.householdId ?? 1);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [commitments, reminders, bills, latestTransactions] = await Promise.all([
      db
        .select()
        .from(commitmentsTable)
        .where(
          and(
            eq(commitmentsTable.householdId, householdId),
            gte(commitmentsTable.commitmentDate, todayStart),
            lte(commitmentsTable.commitmentDate, todayEnd),
          ),
        )
        .orderBy(commitmentsTable.commitmentDate),
      db
        .select()
        .from(remindersTable)
        .where(
          and(
            eq(remindersTable.householdId, householdId),
            gte(remindersTable.reminderDate, todayStart),
            lte(remindersTable.reminderDate, todayEnd),
          ),
        )
        .orderBy(remindersTable.reminderDate),
      db
        .select()
        .from(billsTable)
        .where(and(eq(billsTable.householdId, householdId), gte(billsTable.dueDate, todayStart), lte(billsTable.dueDate, todayEnd)))
        .orderBy(billsTable.dueDate),
      db
        .select()
        .from(transactionsTable)
        .where(eq(transactionsTable.householdId, householdId))
        .orderBy(desc(transactionsTable.transactionDate))
        .limit(5),
    ]);

    res.json({ commitments, reminders, bills, latestTransactions });
  } catch (error) {
    next(error);
  }
});

router.get("/reports/:userId/monthly", requireSession, async (req, res, next) => {
  try {
    const session = getSession(req);
    const userId = Number(req.params.userId);

    if (!canAccessOwnReport(session?.userId ?? null, userId)) {
      res.status(403).json({ message: "Você não pode acessar esse relatório." });
      return;
    }

    const report = await buildMonthlyReport(userId, String(req.query.month ?? ""));

    if (!report) {
      res.status(404).json({ message: "Relatório não encontrado." });
      return;
    }

    res.json(report);
  } catch (error) {
    next(error);
  }
});

router.patch("/reports/:userId/preferences", requireSession, async (req, res, next) => {
  try {
    const session = getSession(req);
    const userId = Number(req.params.userId);

    if (!canAccessOwnReport(session?.userId ?? null, userId)) {
      res.status(403).json({ message: "Você não pode alterar essa preferência." });
      return;
    }

    const enabled = Boolean(req.body.monthlyReportEmailEnabled);

    await db.execute(
      sql`update users set monthly_report_email_enabled = ${enabled}, updated_at = ${new Date()} where id = ${userId}`,
    );

    const user = await getReportUser(userId);
    if (!user) {
      res.status(404).json({ message: "Usuário não encontrado." });
      return;
    }

    res.json({
      ok: true,
      preferences: {
        monthlyReportEmailEnabled: user.monthlyReportEmailEnabled,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/reports/:userId/send-monthly-email", requireSession, async (req, res, next) => {
  try {
    const session = getSession(req);
    const userId = Number(req.params.userId);

    if (!canAccessOwnReport(session?.userId ?? null, userId)) {
      res.status(403).json({ message: "Você não pode enviar esse relatório." });
      return;
    }

    const report = await buildMonthlyReport(userId, String(req.body.month ?? ""));
    if (!report) {
      res.status(404).json({ message: "Relatório não encontrado." });
      return;
    }

    const user = await getReportUser(userId);
    if (!user?.email) {
      res.status(400).json({ message: "Cadastre um e-mail antes de enviar o relatório mensal." });
      return;
    }

    const event = await queueNotificationEvent({
      template: "monthly_report",
      user,
      payload: {
        month: report.period.key,
        monthLabel: report.period.label,
        summary: buildMonthlyEmailSummary({
          monthLabel: report.period.label,
          income: report.metrics.income,
          expenses: report.metrics.expenses,
          balance: report.metrics.balance,
          incomePJ: report.metrics.incomePJ,
          expensesPJ: report.metrics.expensesPJ,
          incomeHouse: report.metrics.incomeHouse,
          expensesHouse: report.metrics.expensesHouse,
          incomePersonal: report.metrics.incomePersonal,
          expensesPersonal: report.metrics.expensesPersonal,
          topCategory: report.metrics.topCategory,
          billsCount: report.metrics.billsCount,
          remindersCount: report.metrics.remindersCount,
          commitmentsCount: report.metrics.commitmentsCount,
        }),
        categoryBreakdown: report.categoryBreakdown,
      },
    });

    res.json({
      ok: true,
      message: "Relatório mensal colocado na fila de e-mail.",
      event,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/reports/monthly-email-batch", requireAdmin, async (req, res, next) => {
  try {
    const month = String(req.body.month ?? "");
    const users = await listEligibleMonthlyReportUsers();
    
    // Libera a requisição da Dashboard imediatamente (Impede gargalo de N+1 travando a API do admin)
    res.json({
      ok: true,
      queued: users.length,
      message: "O envio de e-mails em lote foi iniciado em background processando os relatórios.",
    });

    (async () => {
      for (const user of users) {
        try {
          const report = await buildMonthlyReport(user.id, month);
          if (!report) continue;

          await queueNotificationEvent({
            template: "monthly_report",
            user,
            payload: {
              month: report.period.key,
              monthLabel: report.period.label,
              summary: buildMonthlyEmailSummary({
                monthLabel: report.period.label,
                income: report.metrics.income,
                expenses: report.metrics.expenses,
                balance: report.metrics.balance,
                incomePJ: report.metrics.incomePJ,
                expensesPJ: report.metrics.expensesPJ,
                incomeHouse: report.metrics.incomeHouse,
                expensesHouse: report.metrics.expensesHouse,
                incomePersonal: report.metrics.incomePersonal,
                expensesPersonal: report.metrics.expensesPersonal,
                topCategory: report.metrics.topCategory,
                billsCount: report.metrics.billsCount,
                remindersCount: report.metrics.remindersCount,
                commitmentsCount: report.metrics.commitmentsCount,
              }),
              categoryBreakdown: report.categoryBreakdown,
            },
          });
        } catch (e) {
          console.error({ error: e, userId: user.id }, "Faulting on monthly email generation loop");
        }
      }
    })();

  } catch (error) {
    next(error);
  }
});

export default router;
