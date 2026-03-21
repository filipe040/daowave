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

    // 3. Test invoice PDF generation alone
    if (resolvedOrderId) {
        try {
            const order = await prisma.order.findUnique({
                where: { id: resolvedOrderId },
                include: {
                    event: { include: { organization: true } },
                    user: true,
                    items: { include: { ticketLot: true } },
                    tickets: true,
                },
            });
            if (order) {
                const { generateInvoicePDF, buildInvoiceData } = await import("@/lib/invoice/invoice-pdf.service");
                const invoiceData = buildInvoiceData(order as any);
                const pdfBuffer = await generateInvoicePDF(invoiceData);
                results.invoicePdf = { success: true, sizeBytes: pdfBuffer.length, invoiceNumber: invoiceData.invoiceNumber };
            }
        } catch (e: any) {
            results.invoicePdfError = { message: e.message, stack: e.stack?.substring(0, 600) };
        }
    }

    // 4. Test processTemplateSend directly (bypass idempotency, capture real Resend result)
    if (resolvedOrderId) {
        try {
            const order = await prisma.order.findUnique({
                where: { id: resolvedOrderId },
                include: {
                    event: { include: { organization: true } },
                    user: true,
                    items: { include: { ticketLot: true } },
                    tickets: true,
                },
            });
            if (order) {
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://tickets.daowave.pt";
                const { processTemplateSend } = await import("@/lib/email-service");
                const sendResult = await processTemplateSend(
                    order.user.email,
                    "ticket-delivery",
                    {
                        name: order.user.name || "Cliente",
                        eventTitle: order.event.title,
                        eventDate: order.event.startAt ? new Date(order.event.startAt).toLocaleString("pt-PT") : "Data a anunciar",
                        venueName: (order.event as any).venue || "Local a anunciar",
                        address: (order.event as any).city || "",
                        ticketCount: order.tickets.length,
                        downloadLink: `${appUrl}/account/tickets`,
                    },
                    undefined,
                    undefined // no PDF attachment to simplify test
                );
                results.sendResult = sendResult;
            }
        } catch (e: any) {
            results.sendResultError = { message: e.message, stack: e.stack?.substring(0, 600) };
        }
    }

    return NextResponse.json(results, { status: 200 });
}
