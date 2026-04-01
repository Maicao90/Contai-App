import { db, householdsTable, usersTable } from "./index";
import { sql } from "drizzle-orm";

async function run() {
  console.log("Wiping households and users...");
  await db.execute(sql`TRUNCATE households, users RESTART IDENTITY CASCADE;`);
  console.log("SUCCESS! Database wiped.");
  process.exit(0);
}

run().catch((err) => {
  console.error("ERRO ao zerar:", err);
  process.exit(1);
});
