import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const TX_OPTIONS = { isolationLevel: "Serializable" as const, timeout: 15000 };

function soldCount(lot: { soldCount: number; quantitySold: number }) {
  return Math.max(lot.soldCount ?? 0, lot.quantitySold ?? 0);
}

async function lockTicketLot(tx: Prisma.TransactionClient, lotId: string) {
  await tx.$queryRaw`SELECT id FROM TicketLot WHERE id = ${lotId} FOR UPDATE`;
}

async function lockSeat(tx: Prisma.TransactionClient, seatId: string) {
  await tx.$queryRaw`SELECT id FROM Seat WHERE id = ${seatId} FOR UPDATE`;
}

export class InventoryService {
  static async holdTickets(
    eventId: string,
    userIdOrGuest: string,
    items: { ticketLotId: string; qty: number }[]
  ) {
    return prisma.$transaction(async (tx) => {
      const createdHolds = [];

      for (const item of items) {
        await lockTicketLot(tx, item.ticketLotId);

        const lot = await tx.ticketLot.findUnique({
          where: { id: item.ticketLotId },
        });

        if (!lot) throw new Error("Lote não encontrado.");
        if (lot.eventId !== eventId) throw new Error("Lote não pertence ao evento.");

        if (lot.status !== "ACTIVE" && lot.isActive !== true) {
          throw new Error(`Lote ${lot.name} inativo.`);
        }

        const now = new Date();
        const saleStart = lot.startsAt ?? lot.saleStartAt;
        const saleEnd = lot.endsAt ?? lot.saleEndAt;
        if (saleStart && now < saleStart) {
          throw new Error(`Vendas do lote ${lot.name} ainda não começaram.`);
        }
        if (saleEnd && now > saleEnd) {
          throw new Error(`Vendas do lote ${lot.name} já terminaram.`);
        }

        const activeHoldsAgg = await tx.inventoryHold.aggregate({
          where: {
            ticketLotId: item.ticketLotId,
            status: "ACTIVE",
            expiresAt: { gt: now },
          },
          _sum: { qty: true },
        });

        const activeHoldsCount = activeHoldsAgg._sum.qty || 0;
        const capacity = lot.capacity > 0 ? lot.capacity : lot.quantityTotal;
        const available = capacity - soldCount(lot) - activeHoldsCount;

        if (available < item.qty) {
          throw new Error(
            `Lote ${lot.name} não tem bilhetes suficientes. (Disponível: ${Math.max(0, available)})`
          );
        }

        if (lot.perUserLimit && item.qty > lot.perUserLimit) {
          throw new Error(`O lote ${lot.name} tem um limite de ${lot.perUserLimit} bilhetes por pessoa.`);
        }

        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        const hold = await tx.inventoryHold.create({
          data: {
            eventId,
            ticketLotId: item.ticketLotId,
            userId: userIdOrGuest,
            qty: item.qty,
            expiresAt,
            status: "ACTIVE",
          },
        });

        createdHolds.push(hold);
      }

      return createdHolds;
    }, TX_OPTIONS);
  }

  static async confirmHolds(holdIds: string[]) {
    if (!holdIds.length) return true;

    return prisma.$transaction(async (tx) => {
      const holds = await tx.inventoryHold.findMany({
        where: { id: { in: holdIds } },
      });

      for (const hold of holds) {
        if (hold.status === "CONVERTED") continue;

        await lockTicketLot(tx, hold.ticketLotId);

        const lot = await tx.ticketLot.findUnique({ where: { id: hold.ticketLotId } });
        if (!lot) throw new Error("Lote não encontrado.");

        if (hold.status === "RELEASED" || hold.expiresAt < new Date()) {
          const activeHoldsAgg = await tx.inventoryHold.aggregate({
            where: {
              ticketLotId: hold.ticketLotId,
              status: "ACTIVE",
              expiresAt: { gt: new Date() },
            },
            _sum: { qty: true },
          });

          const activeHoldsCount = activeHoldsAgg._sum.qty || 0;
          const capacity = lot.capacity > 0 ? lot.capacity : lot.quantityTotal;
          const available = capacity - soldCount(lot) - activeHoldsCount;

          if (available < hold.qty) {
            throw new Error(
              `O Lote esgotou enquanto o pagamento era processado (Disponível: ${available}). Por favor contacte o suporte.`
            );
          }
        }

        await tx.ticketLot.update({
          where: { id: hold.ticketLotId },
          data: {
            soldCount: { increment: hold.qty },
            quantitySold: { increment: hold.qty },
          },
        });

        await tx.inventoryHold.update({
          where: { id: hold.id },
          data: { status: "CONVERTED" },
        });
      }

      return true;
    }, TX_OPTIONS);
  }

  static async holdSeats(eventId: string, userIdOrGuest: string, seatIds: string[]) {
    if (!seatIds.length) return [];

    return prisma.$transaction(async (tx) => {
      const createdHolds = [];
      for (const seatId of seatIds) {
        await lockSeat(tx, seatId);

        const seat = await tx.seat.findUnique({ where: { id: seatId } });

        if (!seat) throw new Error("Lugar não encontrado.");
        if (seat.eventId !== eventId) throw new Error("Lugar não pertence a este evento.");
        if (seat.status !== "AVAILABLE") {
          throw new Error(`Lugar ${seat.section}-${seat.row}-${seat.number} já foi vendido ou bloqueado.`);
        }

        const existingHold = await tx.seatHold.findFirst({
          where: {
            seatId,
            status: "ACTIVE",
            expiresAt: { gt: new Date() },
          },
        });

        if (existingHold) {
          throw new Error(
            `O Lugar ${seat.section}-${seat.row}-${seat.number} está a ser reservado por outro cliente neste momento.`
          );
        }

        const hold = await tx.seatHold.create({
          data: {
            eventId,
            seatId,
            userId: userIdOrGuest,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            status: "ACTIVE",
          },
        });

        createdHolds.push(hold);
      }
      return createdHolds;
    }, TX_OPTIONS);
  }

  static async confirmSeatHolds(seatHoldIds: string[]) {
    if (!seatHoldIds.length) return true;

    return prisma.$transaction(async (tx) => {
      const holds = await tx.seatHold.findMany({
        where: { id: { in: seatHoldIds } },
      });

      for (const hold of holds) {
        if (hold.status === "CONVERTED") continue;

        await lockSeat(tx, hold.seatId);

        const seat = await tx.seat.findUnique({ where: { id: hold.seatId } });
        if (seat?.status !== "AVAILABLE" && hold.status === "RELEASED") {
          throw new Error("O lugar já foi vendido enquanto o pagamento era processado.");
        }

        await tx.seat.update({
          where: { id: hold.seatId },
          data: { status: "SOLD" },
        });

        await tx.seatHold.update({
          where: { id: hold.id },
          data: { status: "CONVERTED" },
        });
      }
      return true;
    }, TX_OPTIONS);
  }

  static async releaseExpiredHolds() {
    const now = new Date();

    const [invRes, seatRes] = await Promise.all([
      prisma.inventoryHold.updateMany({
        where: { status: "ACTIVE", expiresAt: { lt: now } },
        data: { status: "RELEASED" },
      }),
      prisma.seatHold.updateMany({
        where: { status: "ACTIVE", expiresAt: { lt: now } },
        data: { status: "RELEASED" },
      }),
    ]);

    return {
      releasedInventoryHolds: invRes.count,
      releasedSeatHolds: seatRes.count,
    };
  }
}
