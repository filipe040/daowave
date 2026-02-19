import { prisma } from "../prisma";
import { OrderStatus } from "@prisma/client";

export class AnalyticsService {
    /**
     * Get Promoter Dashboard Statistics
     */
    static async getPromoterStats(organizationId: string) {
        // 1. Total Revenue & Sales (Paid Orders)
        const orders = await prisma.order.findMany({
            where: {
                event: { organizationId },
                status: OrderStatus.PAID,
            },
            select: { totalCents: true, createdAt: true },
        });

        const totalRevenueCents = orders.reduce((acc, order) => acc + order.totalCents, 0);
        const totalOrders = orders.length;

        // 2. Ticket Sales vs Capacity
        const events = await prisma.event.findMany({
            where: { organizationId },
            include: {
                _count: { select: { tickets: true } },
                ticketLots: { select: { quantityTotal: true, quantitySold: true } },
            },
        });

        let totalTicketsSold = 0;
        let totalCapacity = 0;
        let activeEvents = 0;

        events.forEach(event => {
            if (event.status === 'PUBLISHED') activeEvents++;
            event.ticketLots.forEach(lot => {
                totalCapacity += lot.quantityTotal;
                totalTicketsSold += lot.quantitySold;
            });
        });

        // 3. Recent Sales (Last 30 Days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentRevenue = orders
            .filter(o => o.createdAt >= thirtyDaysAgo)
            .reduce((acc, o) => acc + o.totalCents, 0);

        return {
            revenue: {
                total: totalRevenueCents,
                recent: recentRevenue,
                currency: "EUR"
            },
            tickets: {
                sold: totalTicketsSold,
                capacity: totalCapacity,
                utilization: totalCapacity > 0 ? (totalTicketsSold / totalCapacity) * 100 : 0
            },
            events: {
                total: events.length,
                active: activeEvents
            },
            orders: {
                total: totalOrders
            }
        };
    }

    /**
     * Get Sales Chart Data (Last N days)
     */
    static async getSalesChart(organizationId: string, days = 7) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);

        const orders = await prisma.order.findMany({
            where: {
                event: { organizationId },
                status: OrderStatus.PAID,
                createdAt: { gte: startDate },
            },
            select: { createdAt: true, totalCents: true },
            orderBy: { createdAt: 'asc' }
        });

        // Aggregate by day
        const dailyMap = new Map<string, number>();

        // Initialize dates
        for (let i = 0; i < days; i++) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);
            dailyMap.set(d.toISOString().split('T')[0], 0);
        }

        orders.forEach(order => {
            const day = order.createdAt.toISOString().split('T')[0];
            const current = dailyMap.get(day) || 0;
            dailyMap.set(day, current + order.totalCents);
        });

        return Array.from(dailyMap.entries()).map(([date, revenue]) => ({
            date,
            revenue: revenue / 100 // Convert to units
        }));
    }
}
