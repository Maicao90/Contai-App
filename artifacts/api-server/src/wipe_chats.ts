import { db, conversationLogsTable, pendingDecisionsTable } from "@workspace/db";

async function run() {
  try {
    console.log("Apagando todos os logs de conversa...");
    await db.delete(conversationLogsTable);
    console.log("Apagando pendências incompletas do bot...");
    await db.delete(pendingDecisionsTable);
    console.log("Limpeza concluída com sucesso! Todos os usuários começarão conversas 'novas' agora.");
    process.exit(0);
  } catch (error) {
    console.error("Erro ao limpar:", error);
    process.exit(1);
  }
}

run();
