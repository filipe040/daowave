/**
 * GET /api/promotor/team — membros das organizações onde o user é OWNER ou MANAGER
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit, RATE_LIMITS, safeLog } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    const rateLimitRes = await applyRateLimit(req, RATE_LIMITS.promotorRead);
    if (rateLimitRes) return rateLimitRes;

    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const role = (session.user as { role?: string }).role;
        if (role !== "PROMOTER" && role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Find organizations where this user is OWNER or MANAGER
        const myMemberships = await prisma.organizationMember.findMany({
            where: {
                userId: session.user.id,
                role: { in: ["OWNER", "MANAGER"] },
            },
            select: { organizationId: true },
        });

        const orgIds = myMemberships.map((m) => m.organizationId);

        if (orgIds.length === 0) {
            return NextResponse.json({ data: [], total: 0 });
        }

        // Fetch all members of those organizations (org-level, not per-event)
        const members = await prisma.organizationMember.findMany({
            where: { organizationId: { in: orgIds } },
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
