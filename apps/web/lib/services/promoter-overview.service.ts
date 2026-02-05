/**
 * PromoterOverviewService — KPIs e dados agregados para o dashboard promotor
 */

import { prisma } from "@/lib/prisma";

export type PromoterOverview = {
  eventsTotal: number;
  eventsActive: number; // PUBLISHED, não arquivados
  ticketsSold: number;
  capacityTotal: number; // soma quantityTotal dos lotes dos eventos do promotor
  revenueCents: number;
  ordersPaid: number;
  salesTodayCents: number;
  salesThisWeekCents: number;
};

/** Shape of event data as returned by Prisma for overview aggregation */
export type EventRowForOverview = {
  id: string;
  status: string;
  archivedAt: Date | null;
  ticketLots: { quantityTotal: number; quantitySold: number }[];
  orders: { totalCents: number; createdAt: Date }[];
};

/**
 * Pure aggregation: given event rows and date boundaries, returns PromoterOverview.
 * Used by getPromoterOverview and testable without Prisma.
 */
export function aggregateEventsToOverview(
  events: EventRowForOverview[],
  startOfToday: Date,
  startOfWeek: Date
): PromoterOverview {
  let ticketsSold = 0;
  let capacityTotal = 0;
  let revenueCents = 0;
  let ordersPaid = 0;
  let salesTodayCents = 0;
  let salesThisWeekCents = 0;
  let eventsActive = 0;

  for (const ev of events) {
    const isActive = ev.status === "PUBLISHED" && !ev.archivedAt;
    if (isActive) eventsActive++;

    for (const lot of ev.ticketLots) {
      capacityTotal += lot.quantityTotal;
      ticketsSold += lot.quantitySold;
    }
    for (const order of ev.orders) {
      ordersPaid++;
      revenueCents += order.totalCents;
      const created = new Date(order.createdAt);
      if (created >= startOfToday) salesTodayCents += order.totalCents;
      if (created >= startOfWeek) salesThisWeekCents += order.totalCents;
    }
  }

  return {
    eventsTotal: events.length,
    eventsActive,
    ticketsSold,
    capacityTotal,
    revenueCents,
    ordersPaid,
    salesTodayCents,
    salesThisWeekCents,
  };
}

const emptyOverview: PromoterOverview = {
  eventsTotal: 0,
  eventsActive: 0,
  ticketsSold: 0,
  capacityTotal: 0,
  revenueCents: 0,
  ordersPaid: 0,
  salesTodayCents: 0,
  salesThisWeekCents: 0,
};

export async function getPromoterOverview(promoterId: string): Promise<PromoterOverview> {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  try {
    const events = await prisma.event.findMany({
      where: { promoterProfileId: promoterId },
      select: {
        id: true,
        status: true,
        archivedAt: true,
        ticketLots: { select: { quantityTotal: true, quantitySold: true } },
        orders: {
          where: { status: "PAID" },
          select: { totalCents: true, createdAt: true },
        },
      },
    });
    return aggregateEventsToOverview(events, startOfToday, startOfWeek);
  } catch (err) {
    console.error("[promoter-overview] getPromoterOverview error:", err);
    return emptyOverview;
  }
}
