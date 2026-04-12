import { db, systemSettingsTable, usersTable } from "./lib/db/src/index.ts";

async function run() {
  const settings = await db.select().from(systemSettingsTable);
  console.log("System Settings:", JSON.stringify(settings, null, 2));

  const users = await db.select().from(usersTable).limit(5);
  console.log("Recent Users:", JSON.stringify(users.map(u => ({ id: u.id, email: u.email, role: u.role })), null, 2));
  
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
