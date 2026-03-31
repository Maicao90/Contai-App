import { Router } from "express";
import { and, eq, gte } from "drizzle-orm";
import { billsTable, db, remindersTable } from "@workspace/db";

const router = Router();

router.get("/reminders", async (req, res, next) => {
  try {
    const householdId = Number(req.query.householdId ?? 1);
    const upcoming = req.query.upcoming === "true";
    const rows = await db
      .select()
      .from(remindersTable)
      .where(and(eq(remindersTable.householdId, householdId), ...(upcoming ? [gte(remindersTable.reminderDate, new Date())] : [])))
      .orderBy(remindersTable.reminderDate);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get("/bills", async (req, res, next) => {
  try {
    const householdId = Number(req.query.householdId ?? 1);
    const rows = await db
      .select()
      .from(billsTable)
      .where(eq(billsTable.householdId, householdId))
      .orderBy(billsTable.dueDate);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

export default router;
