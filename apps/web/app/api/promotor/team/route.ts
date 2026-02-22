import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyRateLimit, RATE_LIMITS, safeLog } from "@/lib/security";
import { requirePromoter } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    const rateLimitRes = await applyRateLimit(req, RATE_LIMITS.promotorRead);
    if (rateLimitRes) return rateLimitRes;

    try {
        const { orgId } = await requirePromoter();

        if (!orgId) {
            return NextResponse.json({ data: [], total: 0 });
        }

        // Fetch all members of that organization (org-level, not per-event)
        const members = await prisma.organizationMember.findMany({
            where: { organizationId: orgId },
            orderBy: [{ organization: { name: "asc" } }, { role: "asc" }],
            select: {
                id: true,
                role: true,
                createdAt: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                    },
                },
                organization: {
                    select: { id: true, name: true },
                },
            },
        });

        return NextResponse.json({ data: members, total: members.length });
    } catch (error) {
        safeLog.error("Promotor team error", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
