import { db, householdsTable, notificationEventsTable, subscriptionsTable, usersTable } from "@workspace/db";
import { and, eq, lte, gt, ne, sql } from "drizzle-orm";
import { queueNotificationEvent } from "./notifications";
import { logger } from "./logger";
import { sendWhatsAppText } from "./meta-whatsapp";

/**
 * Worker para verificar assinaturas vencidas e enviar notificações de atraso.
 * Executa periodicamente para garantir que o status do faturamento esteja sempre correto.
 */
export async function checkExpiredSubscriptions() {
  try {
    const now = new Date();
    
    // 1. Buscar assinaturas que venceram e ainda constam como 'active'
    const expiredSubscriptions = await db
      .select()
      .from(subscriptionsTable)
      .where(
        and(
          eq(subscriptionsTable.status, "active"),
          lte(subscriptionsTable.endsAt, now)
        )
      );

    if (expiredSubscriptions.length === 0) {
      return;
    }

    logger.info(`[WORKER] Processando ${expiredSubscriptions.length} assinaturas vencidas.`);

    for (const sub of expiredSubscriptions) {
      // Atualizar status da assinatura para 'overdue' (em atraso)
      await db
        .update(subscriptionsTable)
        .set({ status: "overdue" })
        .where(eq(subscriptionsTable.id, sub.id));

      // Atualizar o status de faturamento da Household
      await db
        .update(householdsTable)
        .set({ 
          billingStatus: "overdue",
          updatedAt: new Date() 
        })
        .where(eq(householdsTable.id, sub.householdId));

      // Atualizar todos os usuários daquela Household
      await db
        .update(usersTable)
        .set({ 
          billingStatus: "overdue",
          updatedAt: new Date() 
        })
        .where(eq(usersTable.householdId, sub.householdId));

      // Enviar notificação por e-mail para o titular
      const [owner] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.householdId, sub.householdId))
        .limit(1); // Simplificação: pega o primeiro usuário encontrado

      if (owner && owner.email) {
        await queueNotificationEvent({
          template: "payment_overdue",
          user: owner,
          payload: {
            renewalDate: sub.endsAt
          }
        });
      }
    }

    logger.info("[WORKER] Verificação de assinaturas concluída.");
  } catch (error) {
    logger.error({ err: error }, "[WORKER] Erro ao verificar assinaturas vencidas.");
  }
}

/**
 * Worker para verificar usuários inativos há mais de 2 horas e enviar recuperação de carrinho via WhatsApp.
 */
export async function checkAbandonedCarts() {
  try {
    const thresholdDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 horas atrás
    const cutoffDate = new Date(Date.now() - 48 * 60 * 60 * 1000); // Até 48h atrás (para não impactar registros antigos infinitamente)

    // Buscar usuários que NÃO têm billingStatus ativo, foram criados nas últimas 48h mas há mais de 2h
    const pendingUsers = await db
      .select()
      .from(usersTable)
      .where(
        and(
          ne(usersTable.billingStatus, "active"),
          lte(usersTable.createdAt, thresholdDate),
          gt(usersTable.createdAt, cutoffDate)
        )
      );

    if (pendingUsers.length === 0) {
      return;
    }

    // Identificar quais já receberam o webhook
    const alreadyNotifiedEvents = await db
      .select({ userId: notificationEventsTable.userId })
      .from(notificationEventsTable)
      .where(
        and(
          eq(notificationEventsTable.type, "abandoned_cart_whatsapp"),
          gt(notificationEventsTable.createdAt, cutoffDate)
        )
      );

    const notifiedUserIds = new Set(alreadyNotifiedEvents.map((ev) => ev.userId));

    let notificationsSent = 0;

    for (const user of pendingUsers) {
      if (notifiedUserIds.has(user.id)) {
        continue;
      }

      // Envia notificação via WhatsApp
      const nomeCortado = user.name.split(" ")[0] || "Plano";
      const messageBody = `Opa ${nomeCortado}! Vi aqui no sistema que você criou sua conta no Contai mas acabou parando na tela de Assinatura.\n\nFicou alguma dúvida ou quer ajuda com algo? Se precisar de uma mão, é só mandar uma mensagem por aqui!`;

      const result = await sendWhatsAppText({
        to: user.phone,
        body: messageBody,
      });

      // Registra que a notificação foi despachada
      await db.insert(notificationEventsTable).values({
        householdId: user.householdId ?? null,
        userId: user.id,
        type: "abandoned_cart_whatsapp",
        channel: "whatsapp",
        recipient: user.phone,
        subject: "Recuperação de Carrinho (WhatsApp)",
        payload: { success: result.sent, result },
        status: result.sent ? "sent" : "failed",
      });

      if (result.sent) {
        notificationsSent++;
      }
    }

    if (notificationsSent > 0) {
      logger.info(`[WORKER] Enviadas ${notificationsSent} mensagens de recuperação de carrinho no WhatsApp.`);
    }

  } catch (error) {
    logger.error({ err: error }, "[WORKER] Erro ao verificar carrinhos abandonados.");
  }
}

/**
 * Inicia o worker com um intervalo definido.
 * @param intervalMs Intervalo em milissegundos (padrão 12 horas)
 */
export function startSubscriptionWorker(intervalMs = 12 * 60 * 60 * 1000) {
  logger.info(`[WORKER] Iniciando verificador de assinaturas (Intervalo: ${intervalMs / 1000 / 60} min)`);
  
  // Executa uma vez no início
  checkExpiredSubscriptions();
  checkAbandonedCarts();
  
  // Assinaturas vencidas (12 em 12h)
  setInterval(() => {
    checkExpiredSubscriptions();
  }, intervalMs);

  // Carrinho Abandonado (10 em 10 min)
  setInterval(() => {
    checkAbandonedCarts();
  }, 10 * 60 * 1000);
}
