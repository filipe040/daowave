import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const ticket = await prisma.ticket.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  console.log(ticket);
}

main().catch(console.error).finally(() => prisma.$disconnect());
