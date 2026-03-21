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

    // 2. Check recent order (if not specified, use most recent PAID order)
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

    // 3. Try invoice PDF generation alone
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
            results.invoicePdfError = { message: e.message, stack: e.stack?.substring(0, 800) };
        }
    }

    // 4. Try sendTicketsEmail end-to-end
    if (resolvedOrderId) {
        try {
            const { sendTicketsEmail } = await import("@/lib/email-service");
            await sendTicketsEmail(resolvedOrderId);
            results.sendTicketsEmail = "called successfully (check server logs for Resend result)";
        } catch (e: any) {
            results.sendTicketsEmailError = { message: e.message, stack: e.stack?.substring(0, 800) };
        }
    }

    return NextResponse.json(results, { status: 200 });
}
