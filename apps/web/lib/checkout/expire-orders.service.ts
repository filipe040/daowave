import { prisma } from "@/lib/prisma";
import { InventoryService } from "@/lib/services/inventory.service";

const PENDING_ORDER_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

export async function expireStalePendingOrders() {
  const cutoff = new Date(Date.now() - PENDING_ORDER_MAX_AGE_MS);

  const staleOrders = await prisma.order.findMany({
    where: {
      status: "PENDING",
      createdAt: { lt: cutoff },
    },
    select: { id: true, userId: true, eventId: true },
    take: 200,
  });

  let cancelled = 0;

  for (const order of staleOrders) {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.order.updateMany({
        where: { id: order.id, status: "PENDING" },
        data: { status: "CANCELED" },
      });
      if (updated.count === 0) return;

      const holds = await tx.inventoryHold.findMany({
        where: {
          userId: order.userId,
          eventId: order.eventId,
          status: "ACTIVE",
        },
        select: { id: true },
      });

      if (holds.length > 0) {
        await tx.inventoryHold.updateMany({
          where: { id: { in: holds.map((h) => h.id) } },
          data: { status: "RELEASED" },
        });
      }
    });
    cancelled++;
  }

  const released = await InventoryService.releaseExpiredHolds();

  return {
    cancelledOrders: cancelled,
    releasedHolds: released,
  };
}
