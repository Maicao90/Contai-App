import { Router } from "express";
import { getDashboardData } from "../lib/contai-engine";

const router = Router();

router.get("/overview", async (req, res, next) => {
  try {
    const userId = Number(req.query.userId ?? 1);
    const data = await getDashboardData(userId);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;
