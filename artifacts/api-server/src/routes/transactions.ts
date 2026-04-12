import { Router } from "express";
import { and, desc, eq, gte, lte, ilike, sql, SQL } from "drizzle-orm";
import { db, transactionsTable } from "@workspace/db";
import { requireSession, getSession } from "../lib/auth";

const router = Router();

router.get("/transactions", requireSession, async (req, res, next) => {
  try {
    const session = getSession(req)!;
    const householdId = session.householdId;

    if (householdId === null) {
      res.json([]);
      return;
    }
    
    const type = req.query.type ? String(req.query.type) : null;
    const category = req.query.category ? String(req.query.category) : null;
    const search = req.query.search ? String(req.query.search) : null;
    const startDate = req.query.startDate ? String(req.query.startDate) : null;
    const endDate = req.query.endDate ? String(req.query.endDate) : null;
    const fiscalContext = req.query.fiscalContext ? String(req.query.fiscalContext) : null;
    const limit = Math.min(100, Number(req.query.limit ?? 50));
    const offset = Number(req.query.offset ?? 0);

    const conditions: SQL[] = [eq(transactionsTable.householdId, householdId)];
    
    if (type) conditions.push(eq(transactionsTable.type, type));
    if (category) conditions.push(eq(transactionsTable.category, category));
    if (search) conditions.push(ilike(transactionsTable.description, `%${search}%`));
    if (startDate) conditions.push(gte(transactionsTable.transactionDate, new Date(startDate)));
    if (endDate) conditions.push(lte(transactionsTable.transactionDate, new Date(endDate)));
    if (fiscalContext) conditions.push(eq(transactionsTable.fiscalContext, fiscalContext as any));

    const rows = await db
      .select()
      .from(transactionsTable)
      .where(and(...conditions))
      .orderBy(desc(transactionsTable.transactionDate))
      .limit(limit)
      .offset(offset);
      
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.post("/transactions", requireSession, async (req, res, next) => {
  try {
    const session = getSession(req)!;
    if (session.householdId === null) {
      res.status(403).json({ message: "Sua conta não tem um grupo doméstico vinculado." });
      return;
    }

    const { type, amount, category, description, transactionDate, visibility, fiscalContext } = req.body;
    
    if (!type || !amount || !category || !description) {
      res.status(400).json({ message: "Preencha todos os campos obrigatórios." });
      return;
    }

    const [row] = await db.insert(transactionsTable).values({
      householdId: session.householdId,
      type,
      amount: String(amount),
      category,
      description,
      transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
      visibility: visibility || "shared",
      fiscalContext: fiscalContext || "personal",
      source: "web",
      createdBy: session.name,
    }).returning();

    res.status(201).json(row);
  } catch (error) {
    next(error);
  }
});

router.patch("/transactions/:id", requireSession, async (req, res, next) => {
  try {
    const session = getSession(req)!;
    if (session.householdId === null) {
      res.status(403).json({ message: "Sua conta não tem um grupo doméstico vinculado." });
      return;
    }

    const id = Number(req.params.id);
    const { type, amount, category, description, transactionDate, visibility, fiscalContext } = req.body;

    const [existing] = await db.select().from(transactionsTable).where(and(eq(transactionsTable.id, id), eq(transactionsTable.householdId, session.householdId))).limit(1);
    
    if (!existing) {
      res.status(404).json({ message: "Transação não encontrada." });
      return;
    }

    const [row] = await db.update(transactionsTable)
      .set({
        type: type ?? existing.type,
        amount: amount ? String(amount) : existing.amount,
        category: category ?? existing.category,
        description: description ?? existing.description,
        transactionDate: transactionDate ? new Date(transactionDate) : existing.transactionDate,
        visibility: visibility ?? existing.visibility,
        fiscalContext: fiscalContext ?? existing.fiscalContext,
      })
      .where(eq(transactionsTable.id, id))
      .returning();

    res.json(row);
  } catch (error) {
    next(error);
  }
});

router.delete("/transactions/:id", requireSession, async (req, res, next) => {
  try {
    const session = getSession(req)!;
    if (session.householdId === null) {
      res.status(403).json({ message: "Sua conta não tem um grupo doméstico vinculado." });
      return;
    }

    const id = Number(req.params.id);

    const [existing] = await db.select().from(transactionsTable).where(and(eq(transactionsTable.id, id), eq(transactionsTable.householdId, session.householdId))).limit(1);
    
    if (!existing) {
      res.status(404).json({ message: "Transação não encontrada." });
      return;
    }

    await db.delete(transactionsTable).where(eq(transactionsTable.id, id));
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
