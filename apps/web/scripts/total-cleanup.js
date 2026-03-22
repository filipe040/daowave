const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting TOTAL Database Cleanup...");

  try {
    // 1. Get all models
    const models = [
      'CheckinLog', 'TransferLog', 'TicketRenderSnapshot', 'AuditLog', 'EmailLog', 
      'EmailJobLog', 'FraudSignal', 'UserSession', 'InventoryHold', 'SeatHold',
      'Payment', 'ManualPayment', 'OrderItem', 'Ticket', 'Order', 'Payout',
      'Invite', 'Coupon', 'TrackingLink', 'EventAsset', 
      'EventTeamMemberPermission', 'EventTeamMember', 'TicketLot', 'TicketType', 
      'Seat', 'SeatMap', 'Event'
    ];

    // Delete in sequence to avoid FK issues (simple way is many tries or specific order)
    for (const m of models) {
      console.log(`- Cleaning ${m}...`);
      try {
        await prisma[m.charAt(0).toLowerCase() + m.slice(1)].deleteMany({});
        console.log(`  ✅ ${m} is clean.`);
      } catch (e) {
        console.warn(`  ⚠️ Could not clean ${m} yet (likely FK): ${e.message}`);
      }
    }

    // Second pass for remaining items
    console.log("🔄 Second pass for remaining items...");
    for (const m of models.reverse()) {
      try {
        await prisma[m.charAt(0).toLowerCase() + m.slice(1)].deleteMany({});
      } catch (e) {}
    }

    // 2. Clear Organizations (except maybe keep the model if we want)
    console.log("- Cleaning Organizations...");
    await prisma.organizationMember.deleteMany({});
    await prisma.organizationTicketTemplate.deleteMany({});
    await prisma.ticketTemplateAsset.deleteMany({});
    await prisma.organization.deleteMany({});

    // 3. Clear Users except ADMIN
    console.log("- Cleaning Users (keeping Admins)...");
    await prisma.promoterProfile.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        role: { not: 'ADMIN' }
      }
    });

    console.log("✅ TOTAL Cleanup completed successfully!");
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
