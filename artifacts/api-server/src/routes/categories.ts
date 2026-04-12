import { Router } from "express";
import { and, asc, eq, isNull, or } from "drizzle-orm";
import { db } from "@workspace/db";
import { categoriesTable } from "@workspace/db/schema";

const router = Router();

router.get("/categories", async (req, res, next) => {
  try {
    const householdId = Number(req.query.householdId ?? 1);
    const userId = Number(req.query.userId ?? 0);
    const rows = await db
      .select()
      .from(categoriesTable)
      .where(
        and(
          eq(categoriesTable.householdId, householdId),
          or(isNull(categoriesTable.userId), eq(categoriesTable.userId, userId)),
        ),
      )
      .orderBy(asc(categoriesTable.name));
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.post("/categories", async (req, res, next) => {
  try {
    const householdId = Number(req.body.householdId ?? 0);
    const userId = Number(req.body.userId ?? 0);
    const name = String(req.body.name ?? "").trim();
    const type = String(req.body.type ?? "expense").trim();
    const visibility = req.body.visibility === "personal" ? "personal" : "shared";
    const fiscalContext = req.body.fiscalContext === "business" ? "business" : "personal";

    if (!householdId || !userId || !name) {
      res.status(400).json({ message: "Dados obrigatórios não enviados." });
      return;
    }

    const duplicate = await db
      .select()
      .from(categoriesTable)
      .where(
        and(
          eq(categoriesTable.householdId, householdId),
          eq(categoriesTable.name, name),
          visibility === "personal"
            ? eq(categoriesTable.userId, userId)
            : and(isNull(categoriesTable.userId), eq(categoriesTable.visibility, "shared")),
        ),
      );

    if (duplicate.length > 0) {
      res.status(409).json({
        message:
          visibility === "personal"
            ? "Você já criou uma categoria pessoal com esse nome."
            : "Essa categoria compartilhada já existe na conta.",
      });
      return;
    }

    const [created] = await db
      .insert(categoriesTable)
      .values({
        householdId,
        userId: visibility === "personal" ? userId : null,
        name,
        type,
        visibility,
        fiscalContext,
        monthlyLimit: req.body.monthlyLimit ? String(req.body.monthlyLimit) : null,
        isDefault: false,
      })
      .returning();

    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

router.patch("/categories/:id", async (req, res, next) => {
  try {
    const categoryId = Number(req.params.id);
    const userId = Number(req.body.userId ?? 0);
    const visibility = req.body.visibility === "personal" ? "personal" : "shared";

    if (!categoryId || !userId) {
      res.status(400).json({ message: "Categoria ou usuário não informados." });
      return;
    }

    const [category] = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .limit(1);

    if (!category) {
      res.status(404).json({ message: "Categoria não encontrada." });
      return;
    }

    if (category.isDefault && (req.body.visibility !== undefined || req.body.userId !== undefined)) {
      if (req.body.monthlyLimit === undefined) {
         res.status(403).json({ message: "Categorias padrão da conta não podem ser alteradas (exceto o limite de gastos)." });
         return;
      }
    }

    if (!category.isDefault && category.userId !== userId && category.userId !== null) {
      res.status(403).json({ message: "Você só pode alterar categorias criadas por você." });
      return;
    }

    const duplicate = await db
      .select()
      .from(categoriesTable)
      .where(
        and(
          eq(categoriesTable.householdId, category.householdId),
          eq(categoriesTable.name, category.name),
          visibility === "personal"
            ? eq(categoriesTable.userId, userId)
            : and(isNull(categoriesTable.userId), eq(categoriesTable.visibility, "shared")),
        ),
      );

    if (duplicate.some((item) => item.id !== categoryId)) {
      res.status(409).json({
        message:
          visibility === "personal"
            ? "Você já tem uma categoria pessoal com esse nome."
            : "A conta já possui uma categoria compartilhada com esse nome.",
      });
      return;
    }

    const [updated] = await db
      .update(categoriesTable)
      .set({
        userId: visibility === "personal" ? userId : null,
        visibility,
        fiscalContext: req.body.fiscalContext ?? category.fiscalContext,
        monthlyLimit: req.body.monthlyLimit !== undefined ? (req.body.monthlyLimit ? String(req.body.monthlyLimit) : null) : category.monthlyLimit,
      })
      .where(eq(categoriesTable.id, categoryId))
      .returning();

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

export default router;


