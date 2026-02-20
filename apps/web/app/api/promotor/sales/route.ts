/**
 * GET /api/promotor/sales — lista ordens/vendas do promotor (scoped por organizationId + promoterId)
 * Query: page, limit, status?, eventId?
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit, RATE_LIMITS, safeLog } from "@/lib/security";
import type { OrderStatus } from "@prisma/client";

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

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
        const statusParam = searchParams.get("status") as OrderStatus | null;
        const eventId = searchParams.get("eventId") ?? undefined;

        const validStatuses: OrderStatus[] = ["PENDING", "PAID", "CANCELED", "REFUNDED"];
        const statusFilter = statusParam && validStatuses.includes(statusParam)
            ? { status: statusParam }
            : {};

        // Scope: find promoter's profile + org membership to restrict to their events
        const promoter = await prisma.promoterProfile.findUnique({
            where: { userId: session.user.id },
        });

        // Find organizationIds where the user is OWNER or MANAGER
        const orgMemberships = await prisma.organizationMember.findMany({
            where: {
                userId: session.user.id,
                role: { in: ["OWNER", "MANAGER"] },
            },
            select: { organizationId: true },
        });
        const orgIds = orgMemberships.map((m) => m.organizationId);

        // Event scope: belongs to their promoterProfile OR their organizations
        const eventWhere = eventId
            ? { id: eventId }
            : {
                OR: [
                    ...(promoter ? [{ promoterId: promoter.id }] : []),
                    ...(orgIds.length > 0 ? [{ organizationId: { in: orgIds } }] : []),
                ],
            };

        // If no profile AND no orgs, return empty
        if (!promoter && orgIds.length === 0) {
            return NextResponse.json({ data: [], total: 0, page, limit, empty: true });
        }

        // If a specific eventId: verify it belongs to them
        if (eventId) {
            const event = await prisma.event.findFirst({
                where: {
                    id: eventId,
                    OR: [
                        ...(promoter ? [{ promoterId: promoter.id }] : []),
                        ...(orgIds.length > 0 ? [{ organizationId: { in: orgIds } }] : []),
                    ],
                },
            });
            if (!event) {
                return NextResponse.json({ error: "Evento não encontrado ou sem permissão" }, { status: 404 });
            }
        }

        const where = {
            ...statusFilter,
            event: eventWhere,
        };

        const [data, total] = await Promise.all([
            prisma.order.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
                select: {
                    id: true,
                    status: true,
                    totalCents: true,
                    currency: true,
                    buyerName: true,
                    buyerEmail: true,
                    createdAt: true,
                    event: { select: { id: true, title: true, slug: true } },
                    _count: { select: { tickets: true } },
                },
            }),
            prisma.order.count({ where }),
        ]);

        return NextResponse.json({ data, total, page, limit });
    } catch (error) {
        safeLog.error("Promotor sales error", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
