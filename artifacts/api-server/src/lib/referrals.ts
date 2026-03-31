import {
  db,
  householdMembersTable,
  referralCampaignsTable,
  referralEventsTable,
  referralsTable,
  subscriptionsTable,
  usersTable,
} from "@workspace/db";
import { and, desc, eq, sql } from "drizzle-orm";

const DEFAULT_ACTIVE_POINTS = 1;
const DEFAULT_PAID_POINTS = 3;

export function buildReferralCode(userId: number) {
  return `contai-${userId}`;
}

export function parseReferralCode(refCode?: string | null) {
  const normalized = String(refCode ?? "").trim().toLowerCase();
  const match = normalized.match(/(?:contai-|ref=|ref-)?(\d+)$/);
  if (!match) {
    return null;
  }
  const userId = Number(match[1]);
  return Number.isFinite(userId) && userId > 0 ? userId : null;
}

async function getActiveCampaign() {
  const [campaign] = await db
    .select()
    .from(referralCampaignsTable)
    .where(eq(referralCampaignsTable.status, "active"))
    .orderBy(desc(referralCampaignsTable.startsAt), desc(referralCampaignsTable.id))
    .limit(1);
  return campaign ?? null;
}

async function createReferralEvent(referralId: number, type: string, detail: string, payload?: Record<string, unknown>) {
  await db.insert(referralEventsTable).values({
    referralId,
    type,
    detail,
    payload: payload ?? null,
  });
}

export async function registerReferralSignup(input: {
  refCode?: string | null;
  referredUserId: number;
}) {
  const referrerUserId = parseReferralCode(input.refCode);
  if (!referrerUserId || referrerUserId === input.referredUserId) {
    return null;
  }

  const [referrer] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, referrerUserId))
    .limit(1);
  const [referred] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, input.referredUserId))
    .limit(1);

  if (!referrer || !referred) {
    return null;
  }

  if (
    referrer.id === referred.id ||
    (referrer.email && referred.email && referrer.email.trim().toLowerCase() === referred.email.trim().toLowerCase()) ||
    referrer.phone === referred.phone ||
    (referrer.householdId && referred.householdId && referrer.householdId === referred.householdId)
  ) {
    return null;
  }

  const [existing] = await db
    .select()
    .from(referralsTable)
    .where(eq(referralsTable.referredUserId, input.referredUserId))
    .limit(1);

  if (existing) {
    return existing;
  }

  const campaign = await getActiveCampaign();

  const [created] = await db
    .insert(referralsTable)
    .values({
      campaignId: campaign?.id ?? null,
      referrerUserId,
      referredUserId: input.referredUserId,
      referralCode: buildReferralCode(referrerUserId),
      status: "entered",
    })
    .returning();

  await createReferralEvent(created.id, "entered", "Cadastro realizado com link de indicação.", {
    campaignId: campaign?.id ?? null,
    referrerUserId,
    referredUserId: input.referredUserId,
  });

  return created;
}

export async function markReferralActiveFromRealUse(userId: number) {
  const [referral] = await db
    .select()
    .from(referralsTable)
    .where(eq(referralsTable.referredUserId, userId))
    .limit(1);

  if (!referral || referral.activePointsAwarded > 0 || referral.status === "paid") {
    return referral ?? null;
  }

  const campaign =
    referral.campaignId != null
      ? (
          await db
            .select()
            .from(referralCampaignsTable)
            .where(eq(referralCampaignsTable.id, referral.campaignId))
            .limit(1)
        )[0] ?? null
      : await getActiveCampaign();

  const activePoints = campaign?.activePoints ?? DEFAULT_ACTIVE_POINTS;

  const [updated] = await db
    .update(referralsTable)
    .set({
      status: "active",
      activePointsAwarded: activePoints,
      activatedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(referralsTable.id, referral.id))
    .returning();

  await createReferralEvent(referral.id, "active", "Primeiro uso real confirmado.", {
    userId,
    activePoints,
  });

  return updated;
}

export async function markReferralPaidForUser(userId: number) {
  const [referral] = await db
    .select()
    .from(referralsTable)
    .where(eq(referralsTable.referredUserId, userId))
    .limit(1);

  if (!referral || referral.paidPointsAwarded > 0) {
    return referral ?? null;
  }

  const campaign =
    referral.campaignId != null
      ? (
          await db
            .select()
            .from(referralCampaignsTable)
            .where(eq(referralCampaignsTable.id, referral.campaignId))
            .limit(1)
        )[0] ?? null
      : await getActiveCampaign();

  const paidPoints = campaign?.paidPoints ?? DEFAULT_PAID_POINTS;

  const [updated] = await db
    .update(referralsTable)
    .set({
      status: "paid",
      activePointsAwarded: referral.activePointsAwarded || (campaign?.activePoints ?? DEFAULT_ACTIVE_POINTS),
      paidPointsAwarded: paidPoints,
      activatedAt: referral.activatedAt ?? new Date(),
      paidAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(referralsTable.id, referral.id))
    .returning();

  await createReferralEvent(referral.id, "paid", "Pagamento confirmado para o indicado.", {
    userId,
    paidPoints,
  });

  return updated;
}

export async function markReferralPaidFromHousehold(householdId: number) {
  const members = await db
    .select()
    .from(householdMembersTable)
    .where(eq(householdMembersTable.householdId, householdId));

  for (const member of members) {
    await markReferralPaidForUser(member.userId);
  }
}

export async function getReferralSummaryForUser(userId: number) {
  const [campaign] = await db
    .select()
    .from(referralCampaignsTable)
    .where(eq(referralCampaignsTable.status, "active"))
    .orderBy(desc(referralCampaignsTable.startsAt), desc(referralCampaignsTable.id))
    .limit(1);

  const referrals = await db
    .select({
      id: referralsTable.id,
      status: referralsTable.status,
      activePointsAwarded: referralsTable.activePointsAwarded,
      paidPointsAwarded: referralsTable.paidPointsAwarded,
      createdAt: referralsTable.createdAt,
      activatedAt: referralsTable.activatedAt,
      paidAt: referralsTable.paidAt,
      referredName: usersTable.name,
    })
    .from(referralsTable)
    .innerJoin(usersTable, eq(usersTable.id, referralsTable.referredUserId))
    .where(eq(referralsTable.referrerUserId, userId))
    .orderBy(desc(referralsTable.createdAt));

  const leaderboard = await db.execute(sql`
    select
      r.referrer_user_id as "userId",
      u.name as "name",
      sum(r.active_points_awarded + r.paid_points_awarded)::int as "points",
      sum(case when r.active_points_awarded > 0 then 1 else 0 end)::int as "activeCount",
      sum(case when r.paid_points_awarded > 0 then 1 else 0 end)::int as "paidCount",
      min(r.created_at) as "firstReferralAt"
    from referrals r
    inner join users u on u.id = r.referrer_user_id
    ${campaign ? sql`where r.campaign_id = ${campaign.id}` : sql``}
    group by r.referrer_user_id, u.name
    order by "points" desc, "paidCount" desc, "firstReferralAt" asc
  `);

  const rankingRows = Array.isArray((leaderboard as any).rows)
    ? (leaderboard as any).rows
    : (leaderboard as any);

  const myPosition = rankingRows.findIndex((row: any) => Number(row.userId) === userId);

  return {
    campaign,
    referralCode: buildReferralCode(userId),
    referrals,
    leaderboard: rankingRows.slice(0, 10).map((row: any, index: number) => ({
      position: index + 1,
      userId: Number(row.userId),
      name: row.name,
      points: Number(row.points ?? 0),
      activeCount: Number(row.activeCount ?? 0),
      paidCount: Number(row.paidCount ?? 0),
    })),
    myPosition: myPosition >= 0 ? myPosition + 1 : null,
    totals: {
      points: referrals.reduce(
        (acc, item) => acc + Number(item.activePointsAwarded ?? 0) + Number(item.paidPointsAwarded ?? 0),
        0,
      ),
      activeCount: referrals.filter((item) => Number(item.activePointsAwarded ?? 0) > 0).length,
      paidCount: referrals.filter((item) => Number(item.paidPointsAwarded ?? 0) > 0).length,
      invitedCount: referrals.length,
    },
  };
}

export async function getAdminReferralOverview() {
  const [campaign] = await db
    .select()
    .from(referralCampaignsTable)
    .orderBy(desc(referralCampaignsTable.startsAt), desc(referralCampaignsTable.id))
    .limit(1);

  const leaderboard = await db.execute(sql`
    select
      r.referrer_user_id as "userId",
      u.name as "name",
      u.email as "email",
      sum(r.active_points_awarded + r.paid_points_awarded)::int as "points",
      sum(case when r.active_points_awarded > 0 then 1 else 0 end)::int as "activeCount",
      sum(case when r.paid_points_awarded > 0 then 1 else 0 end)::int as "paidCount",
      min(r.created_at) as "firstReferralAt"
    from referrals r
    inner join users u on u.id = r.referrer_user_id
    ${campaign ? sql`where r.campaign_id = ${campaign.id}` : sql``}
    group by r.referrer_user_id, u.name, u.email
    order by "points" desc, "paidCount" desc, "firstReferralAt" asc
    limit 20
  `);

  const rankingRows = Array.isArray((leaderboard as any).rows)
    ? (leaderboard as any).rows
    : (leaderboard as any);

  const latestReferralsResult = await db.execute(sql`
    select
      r.id,
      r.status,
      r.created_at as "createdAt",
      r.activated_at as "activatedAt",
      r.paid_at as "paidAt",
      r.active_points_awarded as "activePointsAwarded",
      r.paid_points_awarded as "paidPointsAwarded",
      referrer.name as "referrerName",
      referred.name as "referredName"
    from referrals r
    inner join users referrer on referrer.id = r.referrer_user_id
    inner join users referred on referred.id = r.referred_user_id
    ${campaign ? sql`where r.campaign_id = ${campaign.id}` : sql``}
    order by r.created_at desc
    limit 20
  `);

  const latestReferrals = Array.isArray((latestReferralsResult as any).rows)
    ? (latestReferralsResult as any).rows
    : (latestReferralsResult as any);

  const [{ totalReferrals, totalPoints, paidReferrals, activeReferrals }] = await db.execute(sql`
    select
      count(*)::int as "totalReferrals",
      coalesce(sum(active_points_awarded + paid_points_awarded), 0)::int as "totalPoints",
      sum(case when paid_points_awarded > 0 then 1 else 0 end)::int as "paidReferrals",
      sum(case when active_points_awarded > 0 then 1 else 0 end)::int as "activeReferrals"
    from referrals
    ${campaign ? sql`where campaign_id = ${campaign.id}` : sql``}
  `) as any;

  return {
    campaign,
    leaderboard: rankingRows.map((row: any, index: number) => ({
      position: index + 1,
      userId: Number(row.userId),
      name: row.name,
      email: row.email,
      points: Number(row.points ?? 0),
      activeCount: Number(row.activeCount ?? 0),
      paidCount: Number(row.paidCount ?? 0),
    })),
    latestReferrals,
    totals: {
      totalReferrals: Number(totalReferrals ?? 0),
      totalPoints: Number(totalPoints ?? 0),
      paidReferrals: Number(paidReferrals ?? 0),
      activeReferrals: Number(activeReferrals ?? 0),
    },
  };
}

export async function updateReferralCampaign(input: {
  name: string;
  description?: string | null;
  prizeTitle?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  status?: string | null;
  activePoints?: number | null;
  paidPoints?: number | null;
}) {
  const [existing] = await db
    .select()
    .from(referralCampaignsTable)
    .where(eq(referralCampaignsTable.status, "active"))
    .orderBy(desc(referralCampaignsTable.startsAt), desc(referralCampaignsTable.id))
    .limit(1);

  const values = {
    name: input.name.trim(),
    description: input.description?.trim() || "Campanha principal de indicação do Contai.",
    prizeTitle: input.prizeTitle?.trim() || "iPhone",
    slug: (input.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || "campanha-contai").slice(0, 80),
    status: input.status === "draft" ? "draft" : "active",
    startsAt: input.startsAt ? new Date(input.startsAt) : new Date(),
    endsAt: input.endsAt ? new Date(input.endsAt) : null,
    activePoints: input.activePoints && input.activePoints > 0 ? input.activePoints : DEFAULT_ACTIVE_POINTS,
    paidPoints: input.paidPoints && input.paidPoints > 0 ? input.paidPoints : DEFAULT_PAID_POINTS,
    tiebreakerRule: "paid_first_then_created_at",
    updatedAt: new Date(),
  };

  if (!existing) {
    const [created] = await db.insert(referralCampaignsTable).values(values).returning();
    return created;
  }

  const [updated] = await db
    .update(referralCampaignsTable)
    .set(values)
    .where(eq(referralCampaignsTable.id, existing.id))
    .returning();

  return updated;
}

export async function maybeMarkReferralPaidFromSubscription(householdId: number) {
  const [activeSubscription] = await db
    .select()
    .from(subscriptionsTable)
    .where(and(eq(subscriptionsTable.householdId, householdId), eq(subscriptionsTable.status, "active")))
    .limit(1);

  if (!activeSubscription) {
    return;
  }

  await markReferralPaidFromHousehold(householdId);
}
