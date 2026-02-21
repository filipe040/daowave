import { prisma } from "../prisma";
import { OrderStatus } from "@prisma/client";

export class AnalyticsService {
    /**
     * Get Professional Promoter Dashboard Statistics
     */
    static async getDetailedStats(organizationId: string) {
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        // 1. Fetch all PAID orders for the organization
        const orders = await prisma.order.findMany({
            where: {
                event: { organizationId },
                status: OrderStatus.PAID,
            },
            select: { totalCents: true, createdAt: true },
        });

        // Metrics calculation
        let totalRevenue = 0;
        let todayRevenue = 0;
        let thirtyDayRevenue = 0;

        orders.forEach(order => {
            totalRevenue += order.totalCents;
            if (order.createdAt >= todayStart) todayRevenue += order.totalCents;
            if (order.createdAt >= thirtyDaysAgo) thirtyDayRevenue += order.totalCents;
        });

        // 2. Ticket Sales vs Capacity
        const events = await prisma.event.findMany({
            where: { organizationId, archivedAt: null },
            include: {
                _count: { select: { tickets: true } },
                ticketLots: { select: { quantityTotal: true, quantitySold: true } },
            },
        });

        let totalTicketsSold = 0;
        let totalCapacity = 0;
        let activeEventsCount = 0;

        events.forEach(event => {
            if (event.status === 'PUBLISHED') activeEventsCount++;
            event.ticketLots.forEach(lot => {
                totalCapacity += lot.quantityTotal;
                totalTicketsSold += lot.quantitySold;
            });
        });

        // 3. Platform Fees (Example: 5% + 0.50€ per ticket sold)
        // Adjust this logic if real fee data is stored in the DB
        const estimatedFees = Math.floor(totalRevenue * 0.05 + (totalTicketsSold * 50));
        const netRevenue = totalRevenue - estimatedFees;

        // 4. Check-in Rate
        const checkinStats = await prisma.checkinLog.aggregate({
            where: { event: { organizationId }, result: "SUCCESS" },
            _count: true
        });

        const checkinRate = totalTicketsSold > 0
            ? Math.round((checkinStats._count / totalTicketsSold) * 100)
            : 0;

        return {
            revenue: {
                total: totalRevenue,
                net: netRevenue,
                fees: estimatedFees,
                today: todayRevenue,
                recent: thirtyDayRevenue,
                currency: "EUR"
            },
            tickets: {
                sold: totalTicketsSold,
                capacity: totalCapacity,
                utilization: totalCapacity > 0 ? Math.round((totalTicketsSold / totalCapacity) * 100) : 0,
                checkinRate
            },
            events: {
                total: events.length,
                active: activeEventsCount
            },
            orders: {
                total: orders.length
            }
        };
    }

    /**
     * Get Sales Chart Data (Last N days)
     */
    static async getSalesHistory(organizationId: string, days = 30) {
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

        const dailyMap = new Map<string, number>();

        for (let i = 0; i <= days; i++) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);
            dailyMap.set(d.toISOString().split('T')[0], 0);
        }

        orders.forEach(order => {
            const day = order.createdAt.toISOString().split('T')[0];
            if (dailyMap.has(day)) {
                const current = dailyMap.get(day) || 0;
                dailyMap.set(day, current + order.totalCents);
            }
        });

        return Array.from(dailyMap.entries()).map(([date, revenue]) => ({
            date,
            revenue: revenue / 100 // Convert to EUR
        }));
    }

    /** Legacy support if needed */
    static async getPromoterStats(organizationId: string) {
        return this.getDetailedStats(organizationId);
    }
    static async getSalesChart(organizationId: string) {
        return this.getSalesHistory(organizationId, 7);
    }
}
