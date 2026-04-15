import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { db, householdMembersTable, householdsTable, subscriptionsTable, usersTable } from "@workspace/db";
import { getSession, requireSession } from "../lib/auth";
import { queueNotificationEvent } from "../lib/notifications";
import { markReferralPaidFromHousehold } from "../lib/referrals";

const router = Router();
const PLAN_MONTHLY_AMOUNT = 14.9;
const PLAN_ANNUAL_AMOUNT = 99.9;

function normalizeCycle(value?: string | null) {
  return value === "monthly" ? "monthly" : "annual";
}

function planEndsAt(cycle?: string | null, base = new Date()) {
  return new Date(
    base.getTime() + (normalizeCycle(cycle) === "monthly" ? 30 : 365) * 24 * 60 * 60 * 1000,
  );
}

function normalizePhone(value?: string | null) {
  return String(value ?? "").replace(/\D/g, "");
}

function getCaktoHeader(req: any, name: string) {
  const value = req.headers?.[name] ?? req.headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

function inferCycleFromCaktoPayload(payload: any) {
  const productId = String(
    payload?.product_id ??
      payload?.offer_id ??
      payload?.data?.product_id ??
      payload?.data?.offer_id ??
      payload?.product?.id ??
      "",
  ).trim();

  // IDs REAIS DA CAKTO
  const configuredMonthly = "7svn9jo";
  const configuredAnnual = "3bfrdze_827683";

  if (productId === configuredMonthly) {
    return "monthly";
  }

  if (productId === configuredAnnual) {
    return "annual";
  }

  const text = JSON.stringify(payload ?? {}).toLowerCase();
  if (text.includes("monthly") || text.includes("mensal")) {
    return "monthly";
  }

  return "annual";
}

async function activateHouseholdBillingFromCheckout(input: {
  householdId: number;
  cycle: "monthly" | "annual";
  paymentMethod?: string | null;
  coupon?: string | null;
}) {
  const [household] = await db
    .select()
    .from(householdsTable)
    .where(eq(householdsTable.id, input.householdId))
    .limit(1);

  if (!household) {
    return null;
  }

  await db
    .update(householdsTable)
    .set({
      planType: input.cycle,
      billingStatus: "active",
      updatedAt: new Date(),
    })
    .where(eq(householdsTable.id, input.householdId));

  const members = await db
    .select()
    .from(householdMembersTable)
    .where(eq(householdMembersTable.householdId, input.householdId));

  for (const member of members) {
    await db
      .update(usersTable)
      .set({
        planType: input.cycle,
        billingStatus: "active",
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, member.userId));
  }

  const [currentSubscription] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.householdId, input.householdId))
    .orderBy(desc(subscriptionsTable.createdAt))
    .limit(1);

  const amount = input.cycle === "monthly" ? PLAN_MONTHLY_AMOUNT : PLAN_ANNUAL_AMOUNT;
  const endsAt = planEndsAt(input.cycle, new Date());

  if (currentSubscription) {
    await db
      .update(subscriptionsTable)
      .set({
        cycle: input.cycle,
        paymentMethod: input.paymentMethod ?? currentSubscription.paymentMethod,
        amount: String(amount.toFixed(2)),
        status: "active",
        coupon: input.coupon ?? currentSubscription.coupon,
        startedAt: new Date(),
        endsAt,
      })
      .where(eq(subscriptionsTable.id, currentSubscription.id));
  } else {
    await db.insert(subscriptionsTable).values({
      householdId: input.householdId,
      planName: "Plano Contai",
      cycle: input.cycle,
      paymentMethod: input.paymentMethod ?? "cakto",
      amount: String(amount.toFixed(2)),
      status: "active",
      coupon: input.coupon ?? null,
      startedAt: new Date(),
      endsAt,
    });
  }

  await markReferralPaidFromHousehold(input.householdId);

  return { householdId: input.householdId, cycle: input.cycle };
}

router.get("/subscriptions/:householdId", async (req, res, next) => {
  try {
    const householdId = Number(req.params.householdId);
    const [subscription] = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.householdId, householdId))
      .orderBy(desc(subscriptionsTable.createdAt))
      .limit(1);
    const [household] = await db
      .select()
      .from(householdsTable)
      .where(eq(householdsTable.id, householdId))
      .limit(1);
    res.json(subscription ? { ...subscription, cycle: household?.planType ?? "annual" } : null);
  } catch (error) {
    next(error);
  }
});

router.post("/billing/checkout-simulate", async (req, res) => {
  const cycle = normalizeCycle(String(req.body.cycle ?? req.body.plan ?? "annual"));
  const session = await getSession(req);
  const email = session?.email ?? "";

  // LINKS REAIS DA CAKTO
  const baseUrl = cycle === "monthly" 
    ? "https://pay.cakto.com.br/7svn9jo" 
    : "https://pay.cakto.com.br/3bfrdze_827683";
  
  // Adiciona o e-mail se disponível para facilitar o checkout
  const checkoutUrl = email ? `${baseUrl}?email=${encodeURIComponent(email)}` : baseUrl;

  res.json({
    checkoutUrl,
    cycle,
    amount: cycle === "monthly" ? PLAN_MONTHLY_AMOUNT : PLAN_ANNUAL_AMOUNT,
    status: "ready",
  });
});

router.post("/billing/cakto/webhook", async (req, res, next) => {
  try {
    // SEGREDO REAL DA CAKTO PARA SEGURANÇA
    const configuredSecret = process.env.CAKTO_WEBHOOK_SECRET?.trim() || "a7fb8f76-38b1-48b1-9ca9-20941d519808";
    const providedSecret =
      String(getCaktoHeader(req, "x-cakto-secret") ?? "").trim() ||
      String(getCaktoHeader(req, "x-webhook-secret") ?? "").trim() ||
      String(getCaktoHeader(req, "x-cakto-webhook-secret") ?? "").trim() ||
      String(req.body?.secret ?? "").trim();

    if (configuredSecret && providedSecret && providedSecret !== configuredSecret) {
      console.error(`[WEBHOOK] Tentativa de acesso com segredo invalido: ${providedSecret}`);
      res.status(401).json({ message: "Webhook da Cakto com segredo inválido." });
      return;
    }

    const payload = req.body ?? {};
    const eventName = String(
      payload?.event ?? payload?.type ?? payload?.action ?? payload?.data?.event ?? "",
    )
      .trim()
      .toLowerCase();
    const status = String(
      payload?.status ?? payload?.payment_status ?? payload?.data?.status ?? payload?.order_status ?? "",
    )
      .trim()
      .toLowerCase();

    const approved =
      eventName.includes("paid") ||
      eventName.includes("approved") ||
      status === "paid" ||
      status === "approved" ||
      status === "active";

    if (!approved) {
      res.json({ ok: true, ignored: true, reason: "event_not_approved" });
      return;
    }

    const email = String(
      payload?.customer?.email ?? payload?.email ?? payload?.buyer?.email ?? payload?.data?.customer?.email ?? "",
    )
      .trim()
      .toLowerCase();
    const phone = normalizePhone(
      payload?.customer?.phone ??
        payload?.phone ??
        payload?.buyer?.phone ??
        payload?.data?.customer?.phone ??
        payload?.customer?.cellphone,
    );

    const cycle = inferCycleFromCaktoPayload(payload) as "monthly" | "annual";

    let user =
      email
        ? (
            await db
              .select()
              .from(usersTable)
              .where(eq(usersTable.email, email))
              .limit(1)
          )[0] ?? null
        : null;

    if (!user && phone) {
      const users = await db.select().from(usersTable);
      user = users.find((item) => normalizePhone(item.phone) === phone) ?? null;
    }

    if (!user?.householdId) {
      res.status(404).json({ message: "Nenhum usuário do Contai encontrado para esse pagamento." });
      return;
    }

    // Extracao de cupom de várias fontes comuns (webhook cakto)
    const couponUsed = String(
      payload?.coupon ?? 
      payload?.data?.coupon ?? 
      payload?.offer_code ?? 
      payload?.utm_campaign ?? 
      ""
    ).trim() || null;

    const result = await activateHouseholdBillingFromCheckout({
      householdId: user.householdId,
      cycle,
      paymentMethod: "cakto",
      coupon: couponUsed,
    });

    if (user.email) {
      await queueNotificationEvent({
        template: "payment_confirmed",
        user,
        payload: {
          amount: cycle === "monthly" ? PLAN_MONTHLY_AMOUNT : PLAN_ANNUAL_AMOUNT,
          cycle,
        },
      });
    }

    res.json({ ok: true, result });
  } catch (error) {
    next(error);
  }
});

router.post("/subscriptions/:householdId/change-cycle", requireSession, async (req, res, next) => {
  try {
    const session = getSession(req);
    const householdId = Number(req.params.householdId);
    const nextCycle = normalizeCycle(String(req.body.cycle ?? ""));

    if (!session || (session.role !== "admin" && session.householdId !== householdId)) {
      res.status(403).json({ message: "Voce nao pode alterar o plano desta conta." });
      return;
    }

    const [household] = await db
      .select()
      .from(householdsTable)
      .where(eq(householdsTable.id, householdId))
      .limit(1);

    if (!household) {
      res.status(404).json({ message: "Conta nao encontrada." });
      return;
    }

    const previousCycle = normalizeCycle(household.planType);
    if (previousCycle === nextCycle) {
      res.json({ ok: true, cycle: nextCycle, unchanged: true });
      return;
    }

    await db
      .update(householdsTable)
      .set({
        planType: nextCycle,
        updatedAt: new Date(),
      })
      .where(eq(householdsTable.id, householdId));

    const members = await db
      .select()
      .from(householdMembersTable)
      .where(eq(householdMembersTable.householdId, householdId));

    const userIds = members.map((item) => item.userId);
    for (const userId of userIds) {
      await db
        .update(usersTable)
        .set({
          planType: nextCycle,
          updatedAt: new Date(),
        })
        .where(eq(usersTable.id, userId));
    }

    const [currentSubscription] = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.householdId, householdId))
      .orderBy(desc(subscriptionsTable.createdAt))
      .limit(1);

    const [updatedSubscription] = currentSubscription
      ? await db
          .update(subscriptionsTable)
          .set({
            cycle: nextCycle,
            amount: String((nextCycle === "monthly" ? PLAN_MONTHLY_AMOUNT : PLAN_ANNUAL_AMOUNT).toFixed(2)),
            endsAt: planEndsAt(nextCycle, new Date()),
          })
          .where(eq(subscriptionsTable.id, currentSubscription.id))
          .returning()
      : await db
          .insert(subscriptionsTable)
          .values({
            householdId,
            planName: "Plano Contai",
            cycle: nextCycle,
            paymentMethod: "manual",
            amount: String((nextCycle === "monthly" ? PLAN_MONTHLY_AMOUNT : PLAN_ANNUAL_AMOUNT).toFixed(2)),
            status: "active",
            startedAt: new Date(),
            endsAt: planEndsAt(nextCycle, new Date()),
          })
          .returning();

    const ownerMember = members.find((item) => item.memberType === "owner") ?? members[0] ?? null;
    const [ownerUser] = ownerMember
      ? await db.select().from(usersTable).where(eq(usersTable.id, ownerMember.userId)).limit(1)
      : [null];

    if (ownerUser) {
      await queueNotificationEvent({
        template: "plan_changed",
        user: ownerUser,
        payload: {
          previousCycle,
          newCycle: nextCycle,
        },
      });
    }

    res.json({
      ok: true,
      cycle: nextCycle,
      previousCycle,
      subscription: updatedSubscription,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
