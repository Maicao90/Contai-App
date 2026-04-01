import { db, usersTable, householdsTable, databaseLocation, databaseProvider } from "./lib/db/dist/index.js";
import { eq } from "drizzle-orm";
import { billsTable, commitmentsTable, conversationLogsTable, householdMembersTable, notificationEventsTable, remindersTable, subscriptionsTable, transactionsTable, adminAuditLogsTable, referralEventsTable, referralsTable, referralCampaignsTable } from "./lib/db/dist/schema/contai.js";
import { sql } from "drizzle-orm";

async function run() {
  console.log("DB Provider:", databaseProvider, "Location:", databaseLocation);
  
  // Create dummy household and user
  const [h] = await db.insert(householdsTable).values({ name: "Teste" }).returning();
  const [u] = await db.insert(usersTable).values({ name: "Maicon", phone: "12345", householdId: h.id }).returning();
  await db.insert(householdMembersTable).values({ householdId: h.id, userId: u.id, displayName: "Maicon" });
  
  console.log("Inserted household and user:", h.id, u.id);

  try {
    const householdId = h.id;
    // Simulate nuke
    console.log("Executing wipe...");
    await db.delete(transactionsTable).where(eq(transactionsTable.householdId, householdId));
    await db.delete(billsTable).where(eq(billsTable.householdId, householdId));
    await db.delete(commitmentsTable).where(eq(commitmentsTable.householdId, householdId));
    await db.delete(remindersTable).where(eq(remindersTable.householdId, householdId));
    await db.delete(subscriptionsTable).where(eq(subscriptionsTable.householdId, householdId));
    await db.delete(conversationLogsTable).where(eq(conversationLogsTable.householdId, householdId));
    await db.delete(notificationEventsTable).where(eq(notificationEventsTable.householdId, householdId));
    
    await db.update(householdsTable).set({ ownerUserId: null }).where(eq(householdsTable.id, householdId));
    await db.delete(householdsTable).where(eq(householdsTable.id, householdId));
    await db.delete(usersTable).where(eq(usersTable.id, u.id));
    console.log("Success wiping household and user");
  } catch (err) {
    console.error("Error wiping household:", err);
  }

  process.exit(0);
}

run();
