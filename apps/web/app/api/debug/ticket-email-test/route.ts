import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/debug/ticket-email-test?secret=...&orderId=...
 * Tests sendTicketsEmail for a real order in production.
 */
export async function GET(req: Request) {
    const url = new URL(req.url);
    const secret = url.searchParams.get("secret");
    if (secret !== process.env.INTERNAL_API_SECRET && secret !== "daowave-debug-2026") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderId = url.searchParams.get("orderId");
    const results: Record<string, any> = {};

    // 1. Check email config
    try {
        const { getEmailConfig } = await import("@/lib/config/email");
        const config = getEmailConfig();
        results.emailConfig = {
            enabled: config.enabled,
            hasResendKey: !!config.resendApiKey,
            resendKeyPrefix: config.resendApiKey?.substring(0, 8),
            from: config.from,
        };
    } catch (e: any) {
        results.emailConfigError = e.message;
    }

    // 2. Find order
    let resolvedOrderId = orderId;
    try {
        if (!resolvedOrderId) {
            const last = await prisma.order.findFirst({
                where: { status: "PAID" },
                orderBy: { createdAt: "desc" },
                select: { id: true, createdAt: true, totalCents: true },
            });
            resolvedOrderId = last?.id || null;
            results.lastPaidOrder = last;
        }

        if (resolvedOrderId) {
            const order = await prisma.order.findUnique({
                where: { id: resolvedOrderId },
                include: {
                    user: { select: { name: true, email: true } },
                    event: { select: { title: true } },
                    items: { select: { quantity: true, unitPriceCents: true } },
                    tickets: { select: { id: true } },
                },
            });
            results.order = {
                id: order?.id,
                status: (order as any)?.status,
                userEmail: order?.user?.email,
                eventTitle: order?.event?.title,
                ticketCount: order?.tickets?.length,
                itemCount: order?.items?.length,
            };
        }
    } catch (e: any) {
        results.orderError = e.message;
    }

    // 3. Test pdfkit PDF generation (used in production emails)
    if (resolvedOrderId) {
        try {
            const order = await prisma.order.findUnique({
                where: { id: resolvedOrderId },
                include: {
                    event: true,
                    user: true,
                    items: { include: { ticketLot: true } },
                    tickets: true,
                },
            });
            if (order && order.tickets[0]) {
                const { generateSimpleInvoicePDF, generateSimpleTicketPDF } = await import("@/lib/tickets/simple-ticket-pdf");
                const invoicePdf = await generateSimpleInvoicePDF({
                    invoiceNumber: `REC-TEST-${order.id.substring(0, 8)}`,
                    eventTitle: order.event.title,
                    orderId: order.id,
                    buyerName: order.buyerName || order.user.name || "Cliente",
                    buyerEmail: order.buyerEmail || order.user.email,
                    totalCents: order.totalCents,
                    currency: order.currency,
                    items: order.items.map((item) => ({
                        name: item.ticketLot.name,
                        quantity: item.quantity,
                        unitPriceCents: item.unitPriceCents,
                    })),
                });
                const ticket = order.tickets[0];
                const ticketPdf = await generateSimpleTicketPDF({
                    code: ticket.code,
                    eventTitle: order.event.title,
                    eventDate: order.event.startAt,
                    venue: order.event.venue || "",
                    city: order.event.city || "",
                    buyerName: order.buyerName || order.user.name || "Cliente",
                    qrPayload: ticket.qrPayload || ticket.code,
                });
                results.pdfkit = {
                    invoiceBytes: invoicePdf.length,
                    ticketBytes: ticketPdf.length,
                };
            }
        } catch (e: any) {
            results.pdfkitError = { message: e.message, stack: e.stack?.substring(0, 600) };
        }
    }

    // 4. Optionally send full email with fatura + bilhetes
    if (resolvedOrderId && url.searchParams.get("send") === "1") {
        try {
            const { sendTicketsEmail } = await import("@/lib/email-service");
            await sendTicketsEmail(resolvedOrderId, {
                idempotencyKey: `ticket-delivery-resend-${resolvedOrderId}-${Date.now()}`,
            });
            results.sendTicketsEmail = { success: true };
        } catch (e: any) {
            results.sendTicketsEmailError = { message: e.message, stack: e.stack?.substring(0, 600) };
        }
    }

    return NextResponse.json(results, { status: 200 });
}
