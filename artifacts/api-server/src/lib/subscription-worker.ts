import { db, householdsTable, subscriptionsTable, usersTable } from "@workspace/db";
import { and, eq, lte } from "drizzle-orm";
import { queueNotificationEvent } from "./notifications";
import { logger } from "./logger";

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
 * Inicia o worker com um intervalo definido.
 * @param intervalMs Intervalo em milissegundos (padrão 12 horas)
 */
export function startSubscriptionWorker(intervalMs = 12 * 60 * 60 * 1000) {
  logger.info(`[WORKER] Iniciando verificador de assinaturas (Intervalo: ${intervalMs / 1000 / 60} min)`);
  
  // Executa uma vez no início
  checkExpiredSubscriptions();
  
  // Define o intervalo para as próximas execuções
  setInterval(checkExpiredSubscriptions, intervalMs);
}
