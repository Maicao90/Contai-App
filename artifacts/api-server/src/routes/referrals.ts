import { Router } from "express";
import { getAppBaseUrl, getSession, requireAdmin, requireSession } from "../lib/auth";
import { getAdminReferralOverview, getReferralSummaryForUser, updateReferralCampaign } from "../lib/referrals";

const router = Router();

router.get("/referrals/me", requireSession, async (req, res, next) => {
  try {
    const session = getSession(req);
    if (!session?.userId) {
      res.status(401).json({ message: "Sessão inválida para consultar suas indicações." });
      return;
    }

    const data = await getReferralSummaryForUser(session.userId);
    res.json({
      ...data,
      referralLink: `${getAppBaseUrl()}/cadastro?ref=${data.referralCode}`,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/admin/referrals", requireAdmin, async (_req, res, next) => {
  try {
    const overview = await getAdminReferralOverview();
    res.json(overview);
  } catch (error) {
    next(error);
  }
});

router.post("/admin/referrals/campaign", requireAdmin, async (req, res, next) => {
  try {
    const name = String(req.body.name ?? "").trim();
    if (!name) {
      res.status(400).json({ message: "Informe o nome da campanha." });
      return;
    }

    const campaign = await updateReferralCampaign({
      name,
      description: req.body.description ? String(req.body.description) : null,
      prizeTitle: req.body.prizeTitle ? String(req.body.prizeTitle) : null,
      startsAt: req.body.startsAt ? String(req.body.startsAt) : null,
      endsAt: req.body.endsAt ? String(req.body.endsAt) : null,
      status: req.body.status ? String(req.body.status) : null,
      activePoints: req.body.activePoints ? Number(req.body.activePoints) : null,
      paidPoints: req.body.paidPoints ? Number(req.body.paidPoints) : null,
    });

    res.json({ ok: true, campaign });
  } catch (error) {
    next(error);
  }
});

export default router;
