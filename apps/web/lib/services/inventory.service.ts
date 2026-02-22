import { prisma } from "@/lib/prisma";

export class InventoryService {
    /**
     * Creates an inventory hold for generic tickets to prevent overselling.
     */
    static async holdTickets(
        eventId: string,
        userIdOrGuest: string,
        items: { ticketLotId: string; qty: number }[]
    ) {
        // Process sequentially in a transaction to avoid race conditions
        return await prisma.$transaction(async (tx) => {
            const createdHolds = [];

            for (const item of items) {
                // Get lot details
                const lot = await tx.ticketLot.findUnique({
                    where: { id: item.ticketLotId }
                });

                if (!lot) throw new Error("Lote não encontrado.");
                if (lot.eventId !== eventId) throw new Error("Lote não pertence ao evento.");

                // Support legacy and new status
                if (lot.status !== "ACTIVE" && lot.isActive !== true) {
                    throw new Error(`Lote ${lot.name} inativo.`);
                }

                const now = new Date();
                if (lot.startsAt && now < lot.startsAt) throw new Error(`Vendas do lote ${lot.name} ainda não começaram.`);
                if (lot.endsAt && now > lot.endsAt) throw new Error(`Vendas do lote ${lot.name} já terminaram.`);

                // Calculate active holds
                const activeHoldsAgg = await tx.inventoryHold.aggregate({
                    where: {
                        ticketLotId: item.ticketLotId,
                        status: "ACTIVE",
                        expiresAt: { gt: new Date() }
                    },
                    _sum: { qty: true }
                });

                const activeHoldsCount = activeHoldsAgg._sum.qty || 0;

                // Fallback to legacy quantityTotal if capacity is not set yet
                const capacity = lot.capacity > 0 ? lot.capacity : lot.quantityTotal;
                const available = capacity - lot.soldCount - activeHoldsCount;

                if (available < item.qty) {
                    throw new Error(`Lote ${lot.name} não tem bilhetes suficientes. (Disponível: ${Math.max(0, available)})`);
                }

                if (lot.perUserLimit && item.qty > lot.perUserLimit) {
                    throw new Error(`O lote ${lot.name} tem um limite de ${lot.perUserLimit} bilhetes por pessoa.`);
                }

                // Create hold for 10 minutes
                const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
                const hold = await tx.inventoryHold.create({
                    data: {
                        eventId,
                        ticketLotId: item.ticketLotId,
                        userId: userIdOrGuest,
                        qty: item.qty,
                        expiresAt,
                        status: "ACTIVE"
                    }
                });

                createdHolds.push(hold);
            }

            return createdHolds;
        });
    }

    /**
     * Confirms an inventory hold and increments the sold count atomically
     */
    static async confirmHolds(holdIds: string[]) {
        if (!holdIds.length) return true;

        return await prisma.$transaction(async (tx) => {
            const holds = await tx.inventoryHold.findMany({
                where: { id: { in: holdIds } }
            });

            for (const hold of holds) {
                if (hold.status === "CONVERTED") continue; // Idempotent check

                // If hold was released (expired) but payment went through anyway, we must double check capacity.
                // Normally it shouldn't happen if payment gateway is fast, but it protects against manual overrides.
                if (hold.status === "RELEASED" || hold.expiresAt < new Date()) {
                    const lot = await tx.ticketLot.findUnique({ where: { id: hold.ticketLotId } });
                    if (!lot) throw new Error("Lote não encontrado.");

                    const activeHoldsAgg = await tx.inventoryHold.aggregate({
                        where: {
                            ticketLotId: hold.ticketLotId,
                            status: "ACTIVE",
                            expiresAt: { gt: new Date() }
                        },
                        _sum: { qty: true }
                    });

                    const activeHoldsCount = activeHoldsAgg._sum.qty || 0;
                    const capacity = lot.capacity > 0 ? lot.capacity : lot.quantityTotal;
                    const available = capacity - lot.soldCount - activeHoldsCount;

                    if (available < hold.qty) {
                        throw new Error(`O Lote esgotou enquanto o pagamento era processado (Disponível: ${available}). Por favor contacte o suporte.`);
                    }
                }

                // Actually deduct stock permanently
                await tx.ticketLot.update({
                    where: { id: hold.ticketLotId },
                    data: {
                        soldCount: { increment: hold.qty },
                        quantitySold: { increment: hold.qty }, // Update legacy field as well to not break old UI
                        status: {
                            // Optionally auto-set SOLD_OUT if capacity reached (simplified here)
                            // Better done dynamically, but safe assumption for now.
                            set: "ACTIVE"
                        }
                    }
                });

                // Mark CONVERTED
                await tx.inventoryHold.update({
                    where: { id: hold.id },
                    data: { status: "CONVERTED" }
                });
            }

            return true;
        });
    }

    /**
     * Creates temporary holds for specific seats (Optional MVP)
     */
    static async holdSeats(
        eventId: string,
        userIdOrGuest: string,
        seatIds: string[]
    ) {
        if (!seatIds.length) return [];

        return await prisma.$transaction(async (tx) => {
            const createdHolds = [];
            for (const seatId of seatIds) {
                const seat = await tx.seat.findUnique({ where: { id: seatId } });

                if (!seat) throw new Error("Lugar não encontrado.");
                if (seat.eventId !== eventId) throw new Error("Lugar não pertence a este evento.");
                if (seat.status !== "AVAILABLE") throw new Error(`Lugar ${seat.section}-${seat.row}-${seat.number} já foi vendido ou bloqueado.`);

                // Check if someone else holds it right now
                const existingHold = await tx.seatHold.findFirst({
                    where: {
                        seatId,
                        status: "ACTIVE",
                        expiresAt: { gt: new Date() }
                    }
                });

                if (existingHold) {
                    throw new Error(`O Lugar ${seat.section}-${seat.row}-${seat.number} está a ser reservado por outro cliente neste momento.`);
                }

                const hold = await tx.seatHold.create({
                    data: {
                        eventId,
                        seatId,
                        userId: userIdOrGuest,
                        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
                        status: "ACTIVE"
                    }
                });

                createdHolds.push(hold);
            }
            return createdHolds;
        });
    }

    /**
     * Confirms seat holds (marks seats as SOLD)
     */
    static async confirmSeatHolds(seatHoldIds: string[]) {
        if (!seatHoldIds.length) return true;

        return await prisma.$transaction(async (tx) => {
            const holds = await tx.seatHold.findMany({
                where: { id: { in: seatHoldIds } }
            });

            for (const hold of holds) {
                if (hold.status === "CONVERTED") continue;

                // Seat capacity check 
                const seat = await tx.seat.findUnique({ where: { id: hold.seatId } });
                if (seat?.status !== "AVAILABLE" && hold.status === "RELEASED") {
                    throw new Error(`O lugar já foi vendido enquanto o pagamento era processado.`);
                }

                await tx.seat.update({
                    where: { id: hold.seatId },
                    data: { status: "SOLD" }
                });

                await tx.seatHold.update({
                    where: { id: hold.id },
                    data: { status: "CONVERTED" }
                });
            }
            return true;
        });
    }

    /**
     * Called by a Cron Job periodically to release expired holds and return stock
     */
    static async releaseExpiredHolds() {
        const now = new Date();

        const [invRes, seatRes] = await Promise.all([
            prisma.inventoryHold.updateMany({
                where: {
                    status: "ACTIVE",
                    expiresAt: { lt: now }
                },
                data: { status: "RELEASED" }
            }),
            prisma.seatHold.updateMany({
                where: {
                    status: "ACTIVE",
                    expiresAt: { lt: now }
                },
                data: { status: "RELEASED" }
            })
        ]);

        return {
            releasedInventoryHolds: invRes.count,
            releasedSeatHolds: seatRes.count
        };
    }
}
