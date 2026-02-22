import { prisma } from "../prisma";
import { OrderStatus, OrganizationStatus } from "@prisma/client";

export class AdminService {
    /**
     * Get Platform Overview Stats
     */
    static async getPlatformStats() {
        const [
            totalUsers,
            totalEvents,
            activeOrgs,
            totalOrders,
            financials
        ] = await Promise.all([
            prisma.user.count(),
            prisma.event.count(),
            prisma.organization.count({ where: { status: OrganizationStatus.ACTIVE } }),
            prisma.order.count({ where: { status: OrderStatus.PAID } }),
            prisma.order.aggregate({
                where: { status: OrderStatus.PAID },
                _sum: { totalCents: true }
            })
        ]);

        return {
            users: totalUsers,
            events: totalEvents,
            activeOrganizations: activeOrgs,
            orders: totalOrders,
            gmv: financials._sum.totalCents || 0,
            currency: "EUR"
        };
    }

    /**
     * Get Organizations List
     */
    static async getOrganizations(page = 1, limit = 20, status?: OrganizationStatus) {
        const skip = (page - 1) * limit;
        const where = status ? { status } : {};

        const [orgs, total] = await Promise.all([
            prisma.organization.findMany({
                where,
                skip,
                take: limit,
                include: {
                    members: {
                        where: { role: { in: ['OWNER', 'PROMOTER_OWNER'] } },
                        include: { user: { select: { name: true, email: true } } }
                    },
                    _count: { select: { events: true } }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.organization.count({ where })
        ]);

        return {
            data: orgs,
            total,
            totalPages: Math.ceil(total / limit)
        };
    }

    /**
     * Update Organization Status
     */
    static async updateOrganizationStatus(orgId: string, status: OrganizationStatus) {
        return prisma.organization.update({
            where: { id: orgId },
            data: { status }
        });
    }
}
