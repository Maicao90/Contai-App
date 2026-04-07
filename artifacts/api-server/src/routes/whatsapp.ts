import { Router } from "express";
import { normalizeInboundContent } from "../lib/media-pipeline";
import { processIncomingMessage } from "../lib/contai-engine";
import { sendWhatsAppText } from "../lib/meta-whatsapp";
import { logger } from "../lib/logger";

const router = Router();

function extractIncomingMessage(body: any) {
  const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  const contact = body?.entry?.[0]?.changes?.[0]?.value?.contacts?.[0];

  if (!message) {
    return null;
  }

  return {
    messageId: message.id,
    phone: String(message.from ?? ""),
    userName: contact?.profile?.name,
    messageType: message.type ?? "text",
    content: message.text?.body ?? "",
    mediaId: message.audio?.id ?? message.image?.id,
    mimeType: message.audio?.mime_type ?? message.image?.mime_type,
    caption: message.image?.caption,
  };
}

router.get("/whatsapp/webhook", (req, res) => {
  const expected = process.env.META_WEBHOOK_VERIFY_TOKEN ?? "contai-webhook";

  if (
    req.query["hub.mode"] === "subscribe" &&
    req.query["hub.verify_token"] === expected
  ) {
    res.status(200).send(String(req.query["hub.challenge"] ?? ""));
    return;
  }

  res.sendStatus(403);
});

router.post("/whatsapp/webhook", async (req, res, next) => {
  try {
    const incoming = extractIncomingMessage(req.body);

    if (!incoming) {
      res.sendStatus(200);
      return;
    }

    if (incoming.messageId) {
      try {
        const { db, processedWebhooksTable } = await import("@workspace/db");
        const insertResult = await db
          .insert(processedWebhooksTable)
          .values({ messageId: incoming.messageId })
          .onConflictDoNothing()
          .returning();

        if (insertResult.length === 0) {
          logger.info(`[Idempotência] Ignorando webhook Meta repetido: ${incoming.messageId}`);
          res.sendStatus(200);
          return;
        }
      } catch (dbError) {
        logger.error({ err: dbError }, "[Idempotência] Falha no lock de webhook");
      }
    }

    const normalized = await normalizeInboundContent({
      messageType: incoming.messageType,
      content: incoming.content,
      mediaId: incoming.mediaId,
      mimeType: incoming.mimeType,
      caption: incoming.caption,
    });

    if (normalized.needsUserInput && normalized.userPrompt) {
      await sendWhatsAppText({
        to: incoming.phone,
        body: normalized.userPrompt,
      });

      res.json({
        ok: true,
        intent: "indefinido",
        reply: normalized.userPrompt,
        extracted: normalized.extracted,
      });
      return;
    }

    const result = await processIncomingMessage({
      phone: incoming.phone,
      content: normalized.normalizedText,
      source: "whatsapp",
      messageType: normalized.kind,
      userName: incoming.userName,
    });

    const sendResult = await sendWhatsAppText({
      to: incoming.phone,
      body: result.reply,
    });

    if (!sendResult.sent) {
      logger.warn(
        {
          to: incoming.phone,
          reason: sendResult.reason,
          details: sendResult.details ?? null,
        },
        "WhatsApp response could not be delivered by Meta",
      );
    }

    res.json({
      ok: true,
      intent: result.parsed.intent,
      reply: result.reply,
      extracted: normalized.extracted,
      delivery: sendResult,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/whatsapp/messages/simulate", async (req, res, next) => {
  try {
    const normalized = await normalizeInboundContent({
      messageType: req.body.messageType ?? "text",
      content: req.body.content ?? "",
      mediaId: req.body.mediaId,
      mimeType: req.body.mimeType,
      caption: req.body.caption,
    });

    if (normalized.needsUserInput && normalized.userPrompt) {
      res.json({
        reply: normalized.userPrompt,
        parsed: { intent: "indefinido" },
        extracted: normalized.extracted,
      });
      return;
    }

    const result = await processIncomingMessage({
      phone: req.body.phone ?? "5511999990001",
      content: normalized.normalizedText,
      source: req.body.source ?? "simulator",
      messageType: normalized.kind,
      userName: req.body.userName,
    });

    res.json({
      ...result,
      extracted: normalized.extracted,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
