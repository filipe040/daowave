import { NextResponse } from "next/server";
import { AnalyticsService } from "@/lib/services/analytics";
import { NextRequest } from "next/server";
import { requirePromoter } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        // Use the professional guard
        const { orgId } = await requirePromoter();

        if (!orgId) {
            return NextResponse.json({
                empty: true,
                message: "No organization found"
            });
        }

        const [stats, chart, recentEvents] = await Promise.all([
            AnalyticsService.getDetailedStats(orgId),
            AnalyticsService.getSalesHistory(orgId, 30),
            prisma.event.findMany({
                where: { organizationId: orgId, archivedAt: null },
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: {
                    id: true,
                    title: true,
                    status: true,
                    startAt: true,
                    city: true,
                    _count: { select: { tickets: true } }
                }
            })
        ]);

        return NextResponse.json({ ...stats, chart, recentEvents });

    } catch (error: any) {
        console.error("[Promoter Stats] Error:", error);
        return NextResponse.json({ error: error?.message || "Internal Server Error", stack: error?.stack }, { status: 500 });
    }
}
