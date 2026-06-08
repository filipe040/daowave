import { prisma } from "@/lib/prisma";
import { OrderFinanceService } from "./order-finance.service";

/** Regista no ledger encomendas PAID anteriores ao sistema financeiro */
export class FinanceBackfillService {
  static async backfillOrganization(organizationId: string) {
    const paidOrders = await prisma.order.findMany({
      where: {
        status: "PAID",
        event: { organizationId },
        financialBreakdown: null,
      },
      select: { id: true },
      take: 200,
    });

    let processed = 0;
    let failed = 0;

    for (const order of paidOrders) {
      try {
        await OrderFinanceService.processOrderPayment(order.id, {
          idempotencyKey: `order-payment:${order.id}`,
        });
        processed++;
      } catch (err) {
        console.error(`[FinanceBackfill] order ${order.id}:`, err);
        failed++;
      }
    }

    return { processed, failed, scanned: paidOrders.length };
  }
}
