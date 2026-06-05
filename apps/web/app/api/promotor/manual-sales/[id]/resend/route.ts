import { NextRequest, NextResponse } from "next/server";
import { requirePromoter } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { sendTicketsEmail } from "@/lib/email-service";

export const dynamic = "force-dynamic";

/**
 * POST /api/promotor/manual-sales/[id]/resend
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { orgId } = await requirePromoter();
        const { id } = await params;

        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                manualPayment: true,
                tickets: true,
                event: true,
            },
        });

        if (!order || order.source !== "MANUAL" || order.event.organizationId !== orgId) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        const email = order.buyerEmail || order.manualPayment?.customerEmail;
        if (!email) {
            return NextResponse.json({ error: "No customer email associated with this order" }, { status: 400 });
        }

        await sendTicketsEmail(order.id, {
            idempotencyKey: `ticket-delivery-resend-${order.id}-${Date.now()}`,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[POST Resend Tickets] Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Erro ao reenviar bilhetes" },
            { status: 500 }
        );
    }
}
