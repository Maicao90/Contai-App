import { db, notificationEventsTable, type User } from "@workspace/db";
import { eq } from "drizzle-orm";
import nodemailer from "nodemailer";
import {
  getEmailTemplate,
  listEmailTemplates,
  type EmailTemplateDefinition,
} from "./email-template-settings";
import { getIntegrationStoredValues } from "./integration-secrets";

export type NotificationTemplateKey =
  | "welcome"
  | "password_reset_requested"
  | "password_changed"
  | "payment_confirmed"
  | "payment_overdue"
  | "plan_changed"
  | "monthly_report"
  | "meeting_scheduled"
  | "shared_account_added";

type NotificationPayload = Record<string, unknown>;

type NotificationDraftInput = {
  template: NotificationTemplateKey;
  user: Pick<User, "id" | "name" | "email" | "phone" | "householdId">;
  payload?: NotificationPayload;
};

type CustomEmailInput = {
  userId?: number | null;
  householdId?: number | null;
  recipient: string;
  subject: string;
  text: string;
  html?: string;
};

function getAppBaseUrl() {
  return process.env.APP_BASE_URL?.trim() ?? "https://contai.site";
}

function getEmailLogoUrl() {
  return `${getAppBaseUrl().replace(/\/$/, "")}/favicon.png?v=4`;
}

async function getSmtpConfig() {
  const values = await getIntegrationStoredValues("email");
  const host = values.SMTP_HOST?.trim() ?? "";
  const port = Number(values.SMTP_PORT?.trim() ?? "0");
  const user = values.SMTP_USER?.trim() ?? "";
  const pass = values.SMTP_PASSWORD?.trim() ?? "";
  const fromEmail = values.SMTP_FROM_EMAIL?.trim() ?? "";
  const fromName = values.SMTP_FROM_NAME?.trim() ?? "Contai";

  return {
    host,
    port,
    user,
    pass,
    fromEmail,
    fromName,
    configured: Boolean(host && port && user && pass && fromEmail),
  };
}

async function createEmailTransport() {
  const config = await getSmtpConfig();
  if (!config.configured) {
    return null;
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(value: unknown) {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatCurrency(value: unknown) {
  const amount = Number(value ?? 0);
  if (Number.isNaN(amount) || amount <= 0) {
    return "";
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
}

function normalizeCycleLabel(value: unknown) {
  return String(value ?? "").trim().toLowerCase() === "monthly" ? "mensal" : "anual";
}

function buildTemplateContext(
  userName: string,
  payload: NotificationPayload = {},
): Record<string, string> {
  const appBaseUrl = getAppBaseUrl();

  return {
    userName,
    appBaseUrl,
    resetUrl: String(payload.resetUrl ?? `${appBaseUrl}/redefinir-senha`),
    amountLabel: formatCurrency(payload.amount) || String(payload.amount ?? ""),
    cycleLabel: normalizeCycleLabel(payload.cycle),
    previousCycleLabel: normalizeCycleLabel(payload.previousCycle),
    newCycleLabel: normalizeCycleLabel(payload.newCycle),
    renewalDate: formatDate(payload.renewalDate),
    reportSummary: String(payload.summary ?? "Consulte o painel para ver os detalhes."),
    meetingTitle: String(payload.title ?? "Compromisso"),
    meetingDate: formatDate(payload.date),
    ownerName: String(payload.ownerName ?? "o titular"),
    googleCalendarStatusLine: payload.googleCalendarConnected
      ? "Ele tambem foi sincronizado com o seu Google Agenda."
      : "Para sincronizar proximos compromissos, conecte seu Google Agenda no painel.",
  };
}

function renderTemplateValue(template: string, context: Record<string, string>) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => {
    return context[key] ?? "";
  });
}

function buildPreviewFromText(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(" ");
}

function wrapEmailHtml(subject: string, preview: string, bodyHtml: string) {
  const logoUrl = getEmailLogoUrl();

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(subject)}</title>
    <meta name="description" content="${escapeHtml(preview)}" />
  </head>
  <body style="margin:0;padding:0;background:#07110f;font-family:Arial,Helvetica,sans-serif;color:#e2e8f0;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#07110f;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#0b1620;border:1px solid rgba(148,163,184,0.16);border-radius:28px;overflow:hidden;">
            <tr>
              <td align="center" style="padding:32px 24px 18px 24px;background:linear-gradient(135deg,#0b1620 0%,#10221b 100%);">
                <img src="${logoUrl}" alt="Contai" width="84" height="84" style="display:block;width:84px;height:84px;border-radius:24px;margin:0 auto 16px auto;" />
                <div style="font-size:28px;line-height:1.1;font-weight:700;color:#f8fafc;margin-bottom:8px;">Contai</div>
                <div style="font-size:13px;line-height:1.6;color:#94a3b8;max-width:420px;margin:0 auto;">Seu financeiro e sua rotina organizados no WhatsApp.</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 24px 32px 24px;color:#e2e8f0;font-size:15px;line-height:1.8;">
                ${bodyHtml}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildTemplateBody(
  template: EmailTemplateDefinition,
  userName: string,
  payload: NotificationPayload = {},
) {
  const context = buildTemplateContext(userName, payload);

  const subject = renderTemplateValue(template.subject, context);
  const text = renderTemplateValue(template.text, context);
  const htmlContent = renderTemplateValue(template.html, context);
  const preview = buildPreviewFromText(text);
  const html = wrapEmailHtml(subject, preview, htmlContent);

  return {
    subject,
    text,
    html,
    preview,
  };
}

export async function verifyEmailTransport() {
  const config = await getSmtpConfig();
  if (!config.configured) {
    throw new Error("Preencha host, porta, usuario, senha e remetente para ativar o e-mail.");
  }

  const transport = await createEmailTransport();
  if (!transport) {
    throw new Error("Nao foi possivel iniciar o transporte SMTP.");
  }

  await transport.verify();

  return {
    host: config.host,
    port: config.port,
    fromEmail: config.fromEmail,
    fromName: config.fromName,
  };
}

export function listNotificationTemplates() {
  return listEmailTemplates();
}

export function buildNotificationDraft(input: NotificationDraftInput) {
  const payload = input.payload ?? {};
  const template = getEmailTemplate(input.template);
  const body = buildTemplateBody(template, input.user.name, payload);

  return {
    template: input.template,
    title: template.title,
    description: template.description,
    subject: body.subject,
    preview: body.preview,
    payload,
    text: body.text,
    html: body.html,
  };
}

async function dispatchNotificationEvent(eventId: number) {
  const [event] = await db
    .select()
    .from(notificationEventsTable)
    .where(eq(notificationEventsTable.id, eventId))
    .limit(1);

  if (!event) {
    return null;
  }

  const config = await getSmtpConfig();
  if (!config.configured) {
    console.warn(`[NOTIFICATIONS] Tentativa de envio de e-mail ignorada. SMTP não configurado no painel de Integrações. (Evento ID: ${eventId})`);
    return event;
  }

  if (!event.recipient) {
    const [failed] = await db
      .update(notificationEventsTable)
      .set({
        status: "failed",
        payload: {
          ...((event.payload as Record<string, unknown> | null) ?? {}),
          deliveryError: "Usuario sem e-mail configurado para envio.",
        },
      })
      .where(eq(notificationEventsTable.id, event.id))
      .returning();

    return failed;
  }

  const payload = ((event.payload as Record<string, unknown> | null) ?? {}) as Record<string, unknown>;
  console.log(`[NOTIFICATIONS] Despachando evento ${eventId} (${event.type}) para ${event.recipient}`);

  const transport = await createEmailTransport();
  if (!transport) {
    console.error(`[NOTIFICATIONS] Falha ao criar transporte para evento ${eventId}`);
    return event;
  }

  try {
    const info = await transport.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: event.recipient,
      subject: event.subject,
      text: String(payload.text ?? payload.preview ?? ""),
      html: String(payload.html ?? `<p>${escapeHtml(String(payload.preview ?? ""))}</p>`),
    });

    console.log(`[NOTIFICATIONS] E-mail enviado com sucesso para evento ${eventId}. MessageId: ${info.messageId}`);
    const [sent] = await db
      .update(notificationEventsTable)
      .set({
        status: "sent",
        sentAt: new Date(),
        payload: {
          ...payload,
          messageId: info.messageId,
        },
      })
      .where(eq(notificationEventsTable.id, event.id))
      .returning();

    return sent;
  } catch (error) {
    console.error(`[NOTIFICATIONS] Erro ao enviar e-mail para evento ${eventId}:`, error);
    const [failed] = await db
      .update(notificationEventsTable)
      .set({
        status: "failed",
        payload: {
          ...payload,
          deliveryError: error instanceof Error ? error.message : "Falha ao enviar e-mail.",
        },
      })
      .where(eq(notificationEventsTable.id, event.id))
      .returning();

    return failed;
  }
}

export async function queueNotificationEvent(input: NotificationDraftInput) {
  const draft = buildNotificationDraft(input);
  const [event] = await db
    .insert(notificationEventsTable)
    .values({
      householdId: input.user.householdId ?? null,
      userId: input.user.id,
      type: input.template,
      channel: "email",
      recipient: input.user.email ?? null,
      subject: draft.subject,
      payload: {
        ...draft.payload,
        preview: draft.preview,
        text: draft.text,
        html: draft.html,
      },
      status: "queued",
    })
    .returning();

  const delivered = await dispatchNotificationEvent(event.id);
  return delivered ?? event;
}

export async function sendCustomEmail(input: CustomEmailInput) {
  const subject = input.subject;
  const text = input.text;
  const preview = buildPreviewFromText(text);
  const htmlContent =
    input.html?.trim() || `<p>${escapeHtml(text).replace(/\n/g, "<br />")}</p>`;
  const html = wrapEmailHtml(subject, preview, htmlContent);

  const [event] = await db
    .insert(notificationEventsTable)
    .values({
      householdId: input.householdId ?? null,
      userId: input.userId ?? null,
      type: "admin_custom",
      channel: "email",
      recipient: input.recipient,
      subject,
      payload: {
        preview,
        text,
        html,
      },
      status: "queued",
    })
    .returning();

  const delivered = await dispatchNotificationEvent(event.id);
  return delivered ?? event;
}

export async function retryNotificationEvent(eventId: number) {
  const [queued] = await db
    .update(notificationEventsTable)
    .set({
      status: "queued",
      sentAt: null,
    })
    .where(eq(notificationEventsTable.id, eventId))
    .returning();

  if (!queued) {
    return null;
  }

  return dispatchNotificationEvent(eventId);
}
