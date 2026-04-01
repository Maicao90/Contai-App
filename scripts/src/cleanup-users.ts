import { db, usersTable, householdsTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";

async function main() {
  console.log("🚀 Iniciando limpeza de usuários de teste...");

  // 1. Encontrar os usuários
  const emails = ["rafa@contai.app", "camila@contai.app"];
  const usersToDelete = await db
    .select()
    .from(usersTable)
    .where(or(eq(usersTable.email, emails[0]), eq(usersTable.email, emails[1])));

  if (usersToDelete.length === 0) {
    console.log("✅ Nenhum usuário de teste encontrado.");
    process.exit(0);
  }

  const householdIds = usersToDelete
    .map((u) => u.householdId)
    .filter((id): id is number => id !== null);

  // 2. Deletar os usuários (isso vai disparar o ON DELETE CASCADE para household_members, etc)
  for (const email of emails) {
    await db.delete(usersTable).where(eq(usersTable.email, email));
    console.log(`- Usuário deletado: ${email}`);
  }

  // 3. Deletar os households
  const uniqueHouseholdIds = [...new Set(householdIds)];
  for (const id of uniqueHouseholdIds) {
    const [household] = await db
      .select()
      .from(householdsTable)
      .where(eq(householdsTable.id, id))
      .limit(1);

    if (household && household.name === "Casa Camila & Rafa") {
      await db.delete(householdsTable).where(eq(householdsTable.id, id));
      console.log(`- Household deletado: ${household.name} (ID: ${id})`);
    }
  }

  console.log("✨ Limpeza concluída!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Erro na limpeza:", err);
  process.exit(1);
});
