import { NextRequest, NextResponse } from "next/server";
import { requirePromoter } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { TicketRenderService } from "@/lib/tickets/ticket-render.service";
import { EmailService } from "@/lib/email-service";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

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

        // Generate PDFs for all tickets
        const attachments = await Promise.all(
            order.tickets.map(async (ticket) => {
                const pdf = await TicketRenderService.renderPdf(ticket.id);
                return {
                    filename: `bilhete-${ticket.code}.pdf`,
                    content: pdf,
                    contentType: "application/pdf",
                };
            })
        );

        // Send Email
        const result = await EmailService.sendTemplate({
            to: email,
            templateId: "ticket-delivery",
            variables: {
                name: order.buyerName || "Cliente",
                eventTitle: order.event.title,
                eventDate: format(order.event.startAt, "d 'de' MMMM", { locale: pt }),
                venueName: order.event.venue,
                address: order.event.city,
                ticketCount: order.tickets.length,
                orderId: order.id,
            },
            attachments,
            idempotencyKey: `resend-${order.id}-${Date.now()}`,
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[POST Resend Tickets] Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Erro ao reenviar bilhetes" },
            { status: 500 }
        );
    }
}
