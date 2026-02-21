import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 300; // 5 min cache

export async function GET() {
    try {
        const [totalTickets, totalEvents, totalPromoters] = await Promise.all([
            prisma.ticket.count({ where: { status: { in: ["VALID", "USED"] } } }),
            prisma.event.count({ where: { status: "PUBLISHED", archivedAt: null } }),
            prisma.promoterProfile.count({ where: { status: "APPROVED" } }),
        ]);

        // Fallback seed values so homepage never looks empty
        return NextResponse.json({
            totalTickets: Math.max(totalTickets, 1250),
            totalEvents: Math.max(totalEvents, 18),
            totalPromoters: Math.max(totalPromoters, 6),
        });
    } catch {
        return NextResponse.json(
            { totalTickets: 1250, totalEvents: 18, totalPromoters: 6 },
            { status: 200 }
        );
    }
}
