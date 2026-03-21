import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const events = await prisma.event.findMany({
      where: { organizationId: 'dummy' },
      skip: 0,
      take: 1,
      include: {
        ticketLots: true,
        _count: {
          select: {
            tickets: true,
            orders: { where: { status: "PAID" } },
          },
        },
      },
    });
    console.log("Success");
  } catch (error) {
    console.error("Prisma Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
