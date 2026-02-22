import { NextRequest, NextResponse } from "next/server";
import { requirePromoter } from "@/lib/auth/guards";
import { manualSaleSchema } from "@/lib/security/validation";
import { ManualSaleService } from "@/lib/services/manual-sale.service";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

/**
 * GET /api/promotor/manual-sales
 * List manual sales for the organization
 */
export async function GET(req: NextRequest) {
    try {
        const { orgId } = await requirePromoter();
        if (!orgId) return NextResponse.json({ error: "Organization required" }, { status: 400 });

        const searchParams = req.nextUrl.searchParams;
        const page = Number(searchParams.get("page")) || 1;
        const limit = Number(searchParams.get("limit")) || 20;
        const eventId = searchParams.get("eventId");
        const status = searchParams.get("status");

        const where: any = {
            eventId: eventId || undefined,
            source: "MANUAL",
            event: { organizationId: orgId },
            status: status || undefined,
        };

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                include: {
                    manualPayment: true,
                    event: { select: { title: true } },
                    items: { include: { ticketLot: { select: { name: true } } } },
                    tickets: { select: { id: true, code: true } }
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.order.count({ where }),
        ]);

        return NextResponse.json({
            orders,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                page,
            }
        });
    } catch (error) {
        console.error("[GET Manual Sales] Error:", error);
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
}

/**
 * POST /api/promotor/manual-sales
 * Create a new manual sale
 */
export async function POST(req: NextRequest) {
    try {
        const { session, orgId, role } = await requirePromoter();
        if (!orgId) return NextResponse.json({ error: "Organization required" }, { status: 400 });

        const json = await req.json();
        const idempotencyHeader = req.headers.get("Idempotency-Key");
        const body = manualSaleSchema.parse({
            ...json,
            idempotencyKey: json.idempotencyKey || idempotencyHeader || undefined,
        });

        const result = await ManualSaleService.createManualSale(
            {
                ...body,
                organizationId: orgId,
            },
            (session.user as any).id,
            role as any
        );

        return NextResponse.json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0]?.message || "Dados inválidos" }, { status: 400 });
        }
        console.error("[POST Manual Sales] Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Erro ao criar venda manual" },
            { status: error instanceof Error && error.message.includes("permissão") ? 403 : 500 }
        );
    }
}
