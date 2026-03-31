import { Router } from "express";
import { db, householdMembersTable, householdsTable, usersTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import {
  getSession,
  hashPassword,
  requireSession,
  updateSessionProfile,
  verifyPassword,
} from "../lib/auth";
import { queueNotificationEvent } from "../lib/notifications";
import { normalizeBrazilPhone } from "../lib/phone";

const router = Router();

router.get("/users", async (_req, res, next) => {
  try {
    const users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
    res.json(users);
  } catch (error) {
    next(error);
  }
});

router.get("/users/me", requireSession, async (req, res, next) => {
  try {
    const session = getSession(req);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, session!.userId!)).limit(1);
    const [member] = await db.select().from(householdMembersTable).where(eq(householdMembersTable.userId, user.id)).limit(1);
    const [household] = await db.select().from(householdsTable).where(eq(householdsTable.id, user.householdId!)).limit(1);
    res.json({ user, member, household });
  } catch (error) {
    next(error);
  }
});

router.get("/users/demo", requireSession, async (req, res, next) => {
  try {
    const session = getSession(req);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, session!.userId!)).limit(1);
    const [member] = await db.select().from(householdMembersTable).where(eq(householdMembersTable.userId, user.id)).limit(1);
    const [household] = await db.select().from(householdsTable).where(eq(householdsTable.id, user.householdId!)).limit(1);
    res.json({ user, member, household });
  } catch (error) {
    next(error);
  }
});

router.patch("/users/me", requireSession, async (req, res, next) => {
  try {
    const session = getSession(req);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, session!.userId!)).limit(1);

    if (!user) {
      res.status(404).json({ message: "Usuario não encontrado." });
      return;
    }

    const name = String(req.body.name ?? user.name).trim();
    const email = String(req.body.email ?? user.email ?? "").trim().toLowerCase() || null;
    const phone = normalizeBrazilPhone(String(req.body.phone ?? user.phone));
    const timezone = String(req.body.timezone ?? user.timezone).trim() || "America/Sao_Paulo";
    const currentPassword = String(req.body.currentPassword ?? "");
    const newPassword = String(req.body.newPassword ?? "");

    if (!name || !phone) {
      res.status(400).json({ message: "Nome e telefone sao obrigatorios." });
      return;
    }

    const allUsers = await db.select().from(usersTable);
    const emailOwner = email
      ? allUsers.find((item) => item.id !== user.id && item.email?.trim().toLowerCase() === email)
      : null;
    if (emailOwner) {
      res.status(409).json({ message: "Esse e-mail ja esta em uso." });
      return;
    }

    const phoneOwner = allUsers.find(
      (item) => item.id !== user.id && normalizeBrazilPhone(item.phone) === phone,
    );
    if (phoneOwner) {
      res.status(409).json({ message: "Esse telefone ja esta em uso." });
      return;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        res.status(400).json({ message: "A nova senha precisa ter pelo menos 6 caracteres." });
        return;
      }

      if (user.passwordHash && !verifyPassword(currentPassword, user.passwordHash)) {
        res.status(400).json({ message: "A senha atual não confere." });
        return;
      }
    }

    const [updatedUser] = await db
      .update(usersTable)
      .set({
        name,
        email,
        phone,
        timezone,
        passwordHash: newPassword ? hashPassword(newPassword) : user.passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, user.id))
      .returning();

    const [member] = await db
      .select()
      .from(householdMembersTable)
      .where(eq(householdMembersTable.userId, user.id))
      .limit(1);

    let updatedMember = member ?? null;
    if (member) {
      [updatedMember] = await db
        .update(householdMembersTable)
        .set({
          displayName: name,
        })
        .where(eq(householdMembersTable.id, member.id))
        .returning();
    }

    const [household] = await db
      .select()
      .from(householdsTable)
      .where(eq(householdsTable.id, updatedUser.householdId!))
      .limit(1);

    const updatedSession = updateSessionProfile(req, {
      name: updatedMember?.displayName ?? updatedUser.name,
      email: updatedUser.email ?? null,
    });

    if (newPassword) {
      await queueNotificationEvent({
        template: "password_changed",
        user: updatedUser,
      });
    }

    res.json({
      user: updatedUser,
      member: updatedMember,
      household,
      session: updatedSession,
      message: newPassword
        ? "Seus dados e sua senha foram atualizados."
        : "Seus dados foram atualizados.",
    });
  } catch (error) {
    next(error);
  }
});

export default router;

