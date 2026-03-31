import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { conversationLogsTable, db } from "@workspace/db";

const router = Router();

router.get("/conversations", async (req, res, next) => {
  try {
    const householdId = Number(req.query.householdId ?? 1);
    const rows = await db
      .select()
      .from(conversationLogsTable)
      .where(eq(conversationLogsTable.householdId, householdId))
      .orderBy(desc(conversationLogsTable.createdAt))
      .limit(100);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

export default router;
