import { Router } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, transactionsTable } from "@workspace/db";

const router = Router();

router.get("/transactions", async (req, res, next) => {
  try {
    const householdId = Number(req.query.householdId ?? 1);
    const type = req.query.type ? String(req.query.type) : null;
    const rows = await db
      .select()
      .from(transactionsTable)
      .where(and(eq(transactionsTable.householdId, householdId), ...(type ? [eq(transactionsTable.type, type)] : [])))
      .orderBy(desc(transactionsTable.transactionDate));
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

export default router;
