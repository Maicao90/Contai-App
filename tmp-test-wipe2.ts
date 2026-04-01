import { db, databaseProvider, ensurePermanentAdminUser } from "./lib/db/src/index.ts";
import { eq, sql } from "drizzle-orm";
import { usersTable, householdsTable, householdMembersTable, transactionsTable, billsTable, commitmentsTable, remindersTable, subscriptionsTable, conversationLogsTable, notificationEventsTable, adminAuditLogsTable, referralsTable, referralEventsTable, referralCampaignsTable } from "./lib/db/src/schema/contai.ts";

async function run() {
  console.log("DB Provider:", databaseProvider);
  
  await ensurePermanentAdminUser();
  const [h] = await db.insert(householdsTable).values({ name: "Teste Cascade" }).returning();
  const [u] = await db.insert(usersTable).values({ name: "Maicon", phone: "1234567", householdId: h.id }).returning();
  await db.insert(householdMembersTable).values({ householdId: h.id, userId: u.id, displayName: "Maicon" });
  
  console.log("Inserted household and user:", h.id, u.id);

  try {
    const householdId = h.id;
    const masterEmail = "maiconbatn5@gmail.com";
    const [master] = await db.select().from(usersTable).where(eq(usersTable.email, masterEmail)).limit(1);

    console.log("Master:", master?.id);

    console.log("Executing wipe via wipe code...");
    await db.delete(transactionsTable);
    await db.delete(billsTable);
    await db.delete(commitmentsTable);
    await db.delete(remindersTable);
    await db.delete(subscriptionsTable);
    await db.delete(conversationLogsTable);
    await db.delete(notificationEventsTable);
    
    await db.delete(householdsTable);

    await db.delete(adminAuditLogsTable).where(sql`admin_id IS NULL OR admin_id != ${master?.id ?? -1}`);
    
    if (master) {
      await db.delete(usersTable).where(sql`id != ${master.id}`);
    } else {
      await db.delete(usersTable);
    }
    
    await db.delete(referralEventsTable);
    await db.delete(referralsTable);
    await db.delete(referralCampaignsTable);

    console.log("Success wiping household and user");
  } catch (err) {
    console.error("Error wiping household:", err);
  }

  process.exit(0);
}

run();
