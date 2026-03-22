const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting Database Cleanup...");

  try {
    // 1. Delete dependent logs first (Restrict constraints)
    console.log("- Deleting CheckinLogs...");
    try { await prisma.checkinLog.deleteMany({}); } catch (e) { console.warn("  ! Skip CheckinLog: " + e.message); }
    
    console.log("- Deleting TransferLogs...");
    try { await prisma.transferLog.deleteMany({}); } catch (e) { console.warn("  ! Skip TransferLog: " + e.message); }
    
    console.log("- Deleting TicketRenderSnapshots...");
    try { await prisma.ticketRenderSnapshot.deleteMany({}); } catch (e) { console.warn("  ! Skip TicketRenderSnapshot: " + e.message); }

    // 2. Delete main transactional data
    console.log("- Deleting Payments...");
    try { await prisma.payment.deleteMany({}); } catch (e) { console.warn("  ! Skip Payment: " + e.message); }
    
    console.log("- Deleting ManualPayments...");
    try { await prisma.manualPayment.deleteMany({}); } catch (e) { console.warn("  ! Skip ManualPayment: " + e.message); }
    
    console.log("- Deleting OrderItems...");
    try { await prisma.orderItem.deleteMany({}); } catch (e) { console.warn("  ! Skip OrderItem: " + e.message); }
    
    console.log("- Deleting Tickets...");
    try { await prisma.ticket.deleteMany({}); } catch (e) { console.warn("  ! Skip Ticket: " + e.message); }
    
    console.log("- Deleting Orders...");
    try { await prisma.order.deleteMany({}); } catch (e) { console.warn("  ! Skip Order: " + e.message); }
    
    console.log("- Deleting Payouts...");
    try { await prisma.payout.deleteMany({}); } catch (e) { console.warn("  ! Skip Payout: " + e.message); }

    // 3. Delete system logs
    console.log("- Deleting AuditLogs...");
    try { await prisma.auditLog.deleteMany({}); } catch (e) { console.warn("  ! Skip AuditLog: " + e.message); }
    
    console.log("- Deleting EmailLogs...");
    try { await prisma.emailLog.deleteMany({}); } catch (e) { console.warn("  ! Skip EmailLog: " + e.message); }
    
    console.log("- Deleting EmailJobLogs...");
    try { await prisma.emailJobLog.deleteMany({}); } catch (e) { console.warn("  ! Skip EmailJobLog: " + e.message); }
    
    console.log("- Deleting FraudSignals...");
    try { await prisma.fraudSignal.deleteMany({}); } catch (e) { console.warn("  ! Skip FraudSignal: " + e.message); }
    
    console.log("- Deleting UserSessions...");
    try { await prisma.userSession.deleteMany({}); } catch (e) { console.warn("  ! Skip UserSession: " + e.message); }
    
    console.log("- Deleting InventoryHolds...");
    try { await prisma.inventoryHold.deleteMany({}); } catch (e) { console.warn("  ! Skip InventoryHold: " + e.message); }
    
    console.log("- Deleting SeatHolds...");
    try { await prisma.seatHold.deleteMany({}); } catch (e) { console.warn("  ! Skip SeatHold: " + e.message); }

    // 4. Reset counters in master data
    console.log("- Resetting Coupon usedCount...");
    try {
      await prisma.coupon.updateMany({
        data: { usedCount: 0 }
      });
    } catch (e) { console.warn("  ! Skip Coupon Reset: " + e.message); }
    
    console.log("- Resetting TicketLot sold counters...");
    try {
      await prisma.ticketLot.updateMany({
        data: { 
          quantitySold: 0,
          soldCount: 0
        }
      });
    } catch (e) { console.warn("  ! Skip TicketLot Reset: " + e.message); }

    console.log("✅ Cleanup completed successfully!");
  } catch (error) {
    console.error("❌ Cleanup failed with critical error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
