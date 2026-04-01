import { Router } from "express";
import { asc, desc, eq } from "drizzle-orm";
import { db, householdMembersTable, householdsTable, usersTable } from "@workspace/db";
import { getSession, hashPassword, requireOwner } from "../lib/auth";
import { normalizeBrazilPhone } from "../lib/phone";
import { queueNotificationEvent } from "../lib/notifications";

const router = Router();

router.get("/households", async (_req, res, next) => {
  try {
    const rows = await db.select().from(householdsTable).orderBy(desc(householdsTable.createdAt));
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get("/households/:id/members", async (req, res, next) => {
  try {
    const householdId = Number(req.params.id);
    const members = await db
      .select({
        id: householdMembersTable.id,
        householdId: householdMembersTable.householdId,
        userId: householdMembersTable.userId,
        displayName: householdMembersTable.displayName,
        memberType: householdMembersTable.memberType,
        createdAt: householdMembersTable.createdAt,
        phone: usersTable.phone,
        email: usersTable.email,
        role: usersTable.role,
        name: usersTable.name,
      })
      .from(householdMembersTable)
      .innerJoin(usersTable, eq(usersTable.id, householdMembersTable.userId))
      .where(eq(householdMembersTable.householdId, householdId))
      .orderBy(asc(householdMembersTable.createdAt));

    res.json(members);
  } catch (error) {
    next(error);
  }
});

router.post("/households/:id/members", requireOwner, async (req, res, next) => {
  try {
    const session = getSession(req);
    const householdId = Number(req.params.id);
    const name = String(req.body.name ?? "").trim();
    const displayName = String(req.body.displayName ?? name).trim();
    const phone = normalizeBrazilPhone(String(req.body.phone ?? ""));
    const email = String(req.body.email ?? "").trim().toLowerCase() || null;
    const password = String(req.body.password ?? "");

    if (!session || session.householdId !== householdId) {
      res.status(403).json({ message: "Apenas o titular desta conta pode adicionar membros." });
      return;
    }

    if (!name || !phone || !password) {
      res.status(400).json({ message: "Nome, telefone e senha sao obrigatorios." });
      return;
    }

    const members = await db
      .select()
      .from(householdMembersTable)
      .where(eq(householdMembersTable.householdId, householdId));

    if (members.length >= 2) {
      res.status(409).json({ message: "O Plano Contai permite no maximo 2 membros por conta." });
      return;
    }

    const existingUsers = await db.select().from(usersTable);
    const alreadyExists = existingUsers.find(
      (item) => normalizeBrazilPhone(item.phone) === phone || (email && item.email?.trim().toLowerCase() === email),
    );

    if (alreadyExists) {
      res.status(409).json({ message: "Ja existe um usuario com esse telefone ou e-mail." });
      return;
    }

    const [user] = await db
      .insert(usersTable)
      .values({
        householdId,
        name,
        phone,
        email,
        passwordHash: hashPassword(password),
        timezone: "America/Sao_Paulo",
        role: "partner",
        planType: "annual",
        billingStatus: "active",
      })
      .returning();

    const [member] = await db
      .insert(householdMembersTable)
      .values({
        householdId,
        userId: user.id,
        displayName: displayName || name,
        memberType: "partner",
      })
      .returning();

    await db
      .update(householdsTable)
      .set({
        type: "couple",
        updatedAt: new Date(),
      })
      .where(eq(householdsTable.id, householdId));

    // Despachar e-mail de convite
    const [owner] = await db.select().from(usersTable).where(eq(usersTable.id, session.userId)).limit(1);
    if (user.email) {
      try {
        await queueNotificationEvent({
          template: "shared_account_added",
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            householdId: user.householdId,
          },
          payload: {
            ownerName: owner?.name || "O titular",
            userEmail: user.email,
          },
        });
      } catch (err) {
        console.error("Falha ao enviar e-mail de convite:", err);
      }
    }

    res.status(201).json({
      member: {
        id: member.id,
        householdId: member.householdId,
        userId: user.id,
        displayName: member.displayName,
        memberType: member.memberType,
        phone: user.phone,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      login: {
        identifier: user.email ?? user.phone,
        note: "O novo membro ja pode entrar com login e senha e falar com o próprio WhatsApp.",
      },
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/households/:id/members/:memberId", requireOwner, async (req, res, next) => {
  try {
    const session = getSession(req);
    const householdId = Number(req.params.id);
    const memberId = Number(req.params.memberId);

    if (!session || session.householdId !== householdId) {
      res.status(403).json({ message: "Apenas o titular desta conta pode remover membros." });
      return;
    }

    const [member] = await db
      .select({
        id: householdMembersTable.id,
        userId: householdMembersTable.userId,
        memberType: householdMembersTable.memberType,
      })
      .from(householdMembersTable)
      .where(eq(householdMembersTable.id, memberId))
      .limit(1);

    if (!member) {
      res.status(404).json({ message: "Membro não encontrado." });
      return;
    }

    if (member.memberType === "owner") {
      res.status(400).json({ message: "O titular da conta não pode ser removido por esta tela." });
      return;
    }

    await db.delete(usersTable).where(eq(usersTable.id, member.userId));

    const remainingMembers = await db
      .select()
      .from(householdMembersTable)
      .where(eq(householdMembersTable.householdId, householdId));

    await db
      .update(householdsTable)
      .set({
        type: remainingMembers.length > 1 ? "couple" : "individual",
        updatedAt: new Date(),
      })
      .where(eq(householdsTable.id, householdId));

    res.json({ ok: true, message: "Membro removido com sucesso." });
  } catch (error) {
    next(error);
  }
});

router.patch("/households/:id", requireOwner, async (req, res, next) => {
  try {
    const session = getSession(req);
    const householdId = Number(req.params.id);
    const { name, monthlyIncome } = req.body;

    if (!session || session.householdId !== householdId) {
      res.status(403).json({ message: "Apenas o titular desta conta pode alterar as configurações." });
      return;
    }

    const [updated] = await db
      .update(householdsTable)
      .set({
        ...(name ? { name: String(name).trim() } : {}),
        monthlyIncome: monthlyIncome !== undefined ? (monthlyIncome ? String(monthlyIncome) : null) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(householdsTable.id, householdId))
      .returning();

    if (!updated) {
      res.status(404).json({ message: "Conta não encontrada." });
      return;
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

export default router;

