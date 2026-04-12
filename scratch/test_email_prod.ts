import { verifyEmailTransport, queueNotificationEvent } from "./artifacts/api-server/src/lib/notifications.ts";
import { db, usersTable } from "./lib/db/src/index.ts";
import { eq } from "drizzle-orm";

async function testEmail() {
  console.log("Verificando transporte de e-mail...");
  const transportOk = await verifyEmailTransport();
  console.log("Transporte OK:", transportOk);

  if (transportOk) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, "madrazo017@gmail.com")).limit(1);
    
    if (user) {
      console.log("Enviando e-mail de teste para:", user.email);
      await queueNotificationEvent({
        template: "welcome",
        user,
        payload: {
          householdName: "Teste Projeto Contai",
          subscriptionStatus: "active"
        }
      });
      console.log("Evento de e-mail colocado na fila!");
    } else {
      console.error("Usuário de teste não encontrado no banco.");
    }
  }
  process.exit(0);
}

testEmail().catch(err => {
  console.error("Falha no teste de e-mail:", err);
  process.exit(1);
});
