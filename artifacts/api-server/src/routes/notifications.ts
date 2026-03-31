import { Router, type Response } from "express";
import { desc, eq } from "drizzle-orm";
import { db, notificationEventsTable, usersTable } from "@workspace/db";
import { requireAdmin } from "../lib/auth";
import { updateEmailTemplate } from "../lib/email-template-settings";
import {
  buildNotificationDraft,
  listNotificationTemplates,
  queueNotificationEvent,
  retryNotificationEvent,
  sendCustomEmail,
  type NotificationTemplateKey,
} from "../lib/notifications";

const router = Router();

router.use("/notifications", requireAdmin);

async function loadUser(userId: number) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  return user ?? null;
}

async function queueByTemplate(
  res: Response,
  template: NotificationTemplateKey,
  userId: number,
  payload: Record<string, unknown> = {},
) {
  const user = await loadUser(userId);
  if (!user) {
    res.status(404).json({ message: "Usuario nao encontrado." });
    return;
  }

  const event = await queueNotificationEvent({ template, user, payload });
  res.json({ ok: true, event });
}

router.get("/notifications/templates", (_req, res) => {
  res.json({ templates: listNotificationTemplates() });
});

router.get("/notifications/recipients", async (_req, res, next) => {
  try {
    const rows = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        householdId: usersTable.householdId,
        role: usersTable.role,
      })
      .from(usersTable)
      .orderBy(desc(usersTable.createdAt));

    res.json(
      rows.filter((user) => user.role !== "admin" && Boolean(user.email)).map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        householdId: user.householdId,
      })),
    );
  } catch (error) {
    next(error);
  }
});

router.get("/notifications/history", async (req, res, next) => {
  try {
    const userId = Number(req.query.userId ?? 0);
    const type = String(req.query.type ?? "").trim();
    const limit = Math.min(Number(req.query.limit ?? 40) || 40, 200);
    let rows = await db
      .select()
      .from(notificationEventsTable)
      .orderBy(desc(notificationEventsTable.createdAt));
    if (userId) rows = rows.filter((item) => item.userId === userId);
    if (type) rows = rows.filter((item) => item.type === type);
    res.json(rows.slice(0, limit));
  } catch (error) {
    next(error);
  }
});

router.post("/notifications/preview", async (req, res, next) => {
  try {
    const template = String(req.body.template ?? "") as NotificationTemplateKey;
    const userId = Number(req.body.userId ?? 0);
    const payload = (req.body.payload ?? {}) as Record<string, unknown>;
    const user = await loadUser(userId);

    if (!user) {
      res.status(404).json({ message: "Usuario nao encontrado." });
      return;
    }

    res.json(buildNotificationDraft({ template, user, payload }));
  } catch (error) {
    next(error);
  }
});

router.post("/notifications/templates/:key", async (req, res, next) => {
  try {
    const template = String(req.params.key ?? "") as NotificationTemplateKey;
    const updated = await updateEmailTemplate(template, {
      title: String(req.body.title ?? "").trim(),
      description: String(req.body.description ?? "").trim(),
      subject: String(req.body.subject ?? "").trim(),
      text: String(req.body.text ?? "").trim(),
      html: String(req.body.html ?? "").trim(),
    });

    res.json({ ok: true, template: updated });
  } catch (error) {
    next(error);
  }
});

router.post("/notifications/send-template", async (req, res, next) => {
  try {
    await queueByTemplate(
      res,
      String(req.body.template ?? "") as NotificationTemplateKey,
      Number(req.body.userId ?? 0),
      (req.body.payload ?? {}) as Record<string, unknown>,
    );
  } catch (error) {
    next(error);
  }
});

router.post("/notifications/send-custom", async (req, res, next) => {
  try {
    const userId = Number(req.body.userId ?? 0) || null;
    const user = userId ? await loadUser(userId) : null;
    const recipient = String(req.body.recipient ?? user?.email ?? "").trim();
    const event = await sendCustomEmail({
      userId,
      householdId: user?.householdId ?? null,
      recipient,
      subject: String(req.body.subject ?? "").trim(),
      text: String(req.body.text ?? "").trim(),
      html: String(req.body.html ?? "").trim() || undefined,
    });

    res.json({ ok: true, event });
  } catch (error) {
    next(error);
  }
});

router.post("/notifications/:id/retry", async (req, res, next) => {
  try {
    const event = await retryNotificationEvent(Number(req.params.id));
    if (!event) {
      res.status(404).json({ message: "Evento de e-mail nao encontrado." });
      return;
    }
    res.json({ ok: true, event });
  } catch (error) {
    next(error);
  }
});

router.post("/notifications/welcome", async (req, res, next) => {
  try {
    await queueByTemplate(res, "welcome", Number(req.body.userId ?? 0), req.body.payload ?? {});
  } catch (error) {
    next(error);
  }
});

router.post("/notifications/payment-confirmed", async (req, res, next) => {
  try {
    await queueByTemplate(res, "payment_confirmed", Number(req.body.userId ?? 0), req.body.payload ?? {});
  } catch (error) {
    next(error);
  }
});

router.post("/notifications/payment-overdue", async (req, res, next) => {
  try {
    await queueByTemplate(res, "payment_overdue", Number(req.body.userId ?? 0), req.body.payload ?? {});
  } catch (error) {
    next(error);
  }
});

router.post("/notifications/monthly-report", async (req, res, next) => {
  try {
    await queueByTemplate(res, "monthly_report", Number(req.body.userId ?? 0), req.body.payload ?? {});
  } catch (error) {
    next(error);
  }
});

router.post("/notifications/meeting-scheduled", async (req, res, next) => {
  try {
    await queueByTemplate(res, "meeting_scheduled", Number(req.body.userId ?? 0), req.body.payload ?? {});
  } catch (error) {
    next(error);
  }
});

export default router;
