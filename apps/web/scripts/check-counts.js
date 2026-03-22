const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const counts = {
    Ticket: await prisma.ticket.count(),
    CheckinLog: await prisma.checkinLog.count(),
    TransferLog: await prisma.transferLog.count(),
    Order: await prisma.order.count(),
    OrderItem: await prisma.orderItem.count(),
    Payment: await prisma.payment.count(),
    AuditLog: await prisma.auditLog.count(),
    EmailLog: await prisma.emailLog.count(),
  };
  console.log(JSON.stringify(counts, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
