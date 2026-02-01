/**
 * AdminOverviewService — KPIs globais da plataforma para o dashboard admin
 */

import { prisma } from "@/lib/prisma";

export type AdminOverview = {
  gmvCents: number;
  ordersPaid: number;
  ticketsSold: number;
  eventsTotal: number;
  eventsActive: number; // PUBLISHED, não arquivados
  promotersTotal: number;
  promotersApproved: number;
};

const emptyAdminOverview: AdminOverview = {
  gmvCents: 0,
  ordersPaid: 0,
  ticketsSold: 0,
  eventsTotal: 0,
  eventsActive: 0,
  promotersTotal: 0,
  promotersApproved: 0,
};

export async function getAdminOverview(): Promise<AdminOverview> {
  try {
    const [
      ordersAgg,
      ticketsCount,
      eventsCount,
      eventsActiveCount,
      promotersCount,
      promotersApprovedCount,
    ] = await Promise.all([
      prisma.order.aggregate({
        where: { status: "PAID" },
        _sum: { totalCents: true },
        _count: true,
      }),
      prisma.ticket.count(),
      prisma.event.count(),
      prisma.event.count({
        where: { status: "PUBLISHED", archivedAt: null },
      }),
      prisma.promoterProfile.count(),
      prisma.promoterProfile.count({ where: { status: "APPROVED" } }),
    ]);

    return {
      gmvCents: ordersAgg._sum.totalCents ?? 0,
      ordersPaid: ordersAgg._count,
      ticketsSold: ticketsCount,
      eventsTotal: eventsCount,
      eventsActive: eventsActiveCount,
      promotersTotal: promotersCount,
      promotersApproved: promotersApprovedCount,
    };
  } catch (err) {
    console.error("[admin-overview] getAdminOverview error:", err);
    return emptyAdminOverview;
  }
}
