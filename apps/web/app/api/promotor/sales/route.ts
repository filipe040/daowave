import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePromoter } from "@/lib/auth/guards";
import { canViewSales } from "@/lib/auth/member-permissions";
import { OrderStatus } from "@prisma/client";

export async function GET(req: Request) {
    try {
        const { orgId, role, session } = await requirePromoter();
        const isGlobalAdmin = (session.user as { role?: string }).role === "ADMIN";

        if (!isGlobalAdmin && !canViewSales(role)) {
            return NextResponse.json({ error: "Sem permissão para ver vendas." }, { status: 403 });
        }

        if (!orgId) return NextResponse.json({ data: [], total: 0 });

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const status = searchParams.get("status") || "ALL";
        const skip = (page - 1) * limit;

        const where: any = {
            event: { organizationId: orgId }
        };

        if (status !== "ALL") {
            where.status = status as OrderStatus;
        }

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                include: {
                    event: { select: { id: true, title: true, slug: true } },
                    _count: { select: { tickets: true } }
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.order.count({ where })
        ]);

        return NextResponse.json({
            data: orders,
            total,
            page,
            limit
        });
    } catch (error) {
        console.error("[Sales API] Error:", error);
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
}
