import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Starting TicketLot backfill...");

    const lots = await prisma.ticketLot.findMany();

    for (const lot of lots) {
        // Count valid tickets for this lot
        const soldTicketsCount = await prisma.ticket.count({
            where: {
                ticketLotId: lot.id,
                status: {
                    notIn: ["CANCELLED", "REFUNDED"],
                },
            },
        });

        // Update the lot with new advanced ticketing fields mapped from legacy
        await prisma.ticketLot.update({
            where: { id: lot.id },
            data: {
                capacity: lot.quantityTotal,
                soldCount: soldTicketsCount,
                startsAt: lot.saleStartAt,
                endsAt: lot.saleEndAt,
                status: lot.isActive ? "ACTIVE" : "PAUSED",
            },
        });

        console.log(`Updated lot ${lot.id} - Capacity: ${lot.quantityTotal}, Sold: ${soldTicketsCount}`);
    }

    console.log("TicketLot backfill completed.");
}

main()
    .catch((e) => {
        console.error("Backfill failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
