import { Router } from "express";
import { and, eq, gte } from "drizzle-orm";
import { commitmentsTable, db } from "@workspace/db";

const router = Router();

router.get("/commitments", async (req, res, next) => {
  try {
    const householdId = Number(req.query.householdId ?? 1);
    const upcoming = req.query.upcoming === "true";
    const rows = await db
      .select()
      .from(commitmentsTable)
      .where(and(eq(commitmentsTable.householdId, householdId), ...(upcoming ? [gte(commitmentsTable.commitmentDate, new Date())] : [])))
      .orderBy(commitmentsTable.commitmentDate);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

export default router;
