import { Router } from "express";
import {
  buildGoogleCalendarAuthUrl,
  buildGoogleCalendarErrorRedirect,
  buildGoogleCalendarSuccessRedirect,
  connectGoogleCalendar,
  disconnectGoogleCalendar,
  getGoogleCalendarStatus,
  isGoogleCalendarConfigured,
  parseGoogleState,
  quickConnectGoogleCalendar,
  syncOutstandingCalendarItemsForUser,
} from "../lib/google-calendar";
import { getSession, requireSession } from "../lib/auth";

const router = Router();

function canAccessUser(sessionUserId: number | null, targetUserId: number) {
  return Boolean(sessionUserId && sessionUserId === targetUserId);
}

router.get("/google-calendar/:userId", requireSession, async (req, res, next) => {
  try {
    const session = getSession(req);
    const userId = Number(req.params.userId);

    if (!canAccessUser(session?.userId ?? null, userId)) {
      res.status(403).json({ message: "Você não pode acessar essa integracao." });
      return;
    }

    res.json(await getGoogleCalendarStatus(userId));
  } catch (error) {
    next(error);
  }
});

router.get("/google-calendar/:userId/connect", requireSession, async (req, res) => {
  const session = getSession(req);
  const userId = Number(req.params.userId);

  if (!canAccessUser(session?.userId ?? null, userId)) {
    res.redirect(buildGoogleCalendarErrorRedirect("forbidden"));
    return;
  }

  if (!isGoogleCalendarConfigured()) {
    res.redirect(buildGoogleCalendarErrorRedirect("missing_config"));
    return;
  }

  res.redirect(buildGoogleCalendarAuthUrl(userId));
});

router.post("/google-calendar/:userId/quick-connect", requireSession, async (req, res, next) => {
  try {
    const session = getSession(req);
    const userId = Number(req.params.userId);

    if (!canAccessUser(session?.userId ?? null, userId)) {
      res.status(403).json({ message: "Você não pode conectar essa conta." });
      return;
    }

    const email = String(req.body.email ?? "").trim() || undefined;
    const connection = await quickConnectGoogleCalendar(userId, email);
    res.json({
      ok: true,
      mode: "prepared",
      connection,
      message:
        "Conexão rápida ativada. Sua conta ficou preparada para o Google Agenda e a sincronização completa entra automaticamente quando o OAuth oficial estiver configurado.",
    });
  } catch (error) {
    next(error);
  }
});

router.get("/google-calendar/callback", async (req, res) => {
  const code = String(req.query.code ?? "");
  const state = String(req.query.state ?? "");
  const parsedState = parseGoogleState(state);

  if (!code || !parsedState?.userId) {
    res.redirect(buildGoogleCalendarErrorRedirect("invalid_callback"));
    return;
  }

  try {
    await connectGoogleCalendar(parsedState.userId, code);
    res.redirect(buildGoogleCalendarSuccessRedirect());
  } catch {
    res.redirect(buildGoogleCalendarErrorRedirect("connect_failed"));
  }
});

router.post("/google-calendar/:userId/disconnect", requireSession, async (req, res, next) => {
  try {
    const session = getSession(req);
    const userId = Number(req.params.userId);

    if (!canAccessUser(session?.userId ?? null, userId)) {
      res.status(403).json({ message: "Você não pode desconectar essa conta." });
      return;
    }

    await disconnectGoogleCalendar(userId);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.post("/google-calendar/:userId/sync", requireSession, async (req, res, next) => {
  try {
    const session = getSession(req);
    const userId = Number(req.params.userId);

    if (!canAccessUser(session?.userId ?? null, userId)) {
      res.status(403).json({ message: "Você não pode sincronizar essa conta." });
      return;
    }

    res.json(await syncOutstandingCalendarItemsForUser(userId));
  } catch (error) {
    next(error);
  }
});

export default router;

