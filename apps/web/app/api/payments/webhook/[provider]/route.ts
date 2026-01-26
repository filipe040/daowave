import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPaymentProvider } from "@/lib/payments/provider";
import { generateTicketCode } from "@/lib/utils";
import { getQRPayload } from "@/lib/qr/generate";
import { sendTicketsEmail } from "@/lib/email-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    const signature = req.headers.get("x-signature") || "";
    const body = await req.text();
    
    const paymentProvider = getPaymentProvider(provider.toUpperCase() as "MBWAY" | "MULTIBANCO" | "PAYPAL");

    // Verify webhook signature
    if (!paymentProvider.verifyWebhook(signature, body)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(body);
    const webhookData = paymentProvider.parseWebhook(payload);

    if (!webhookData || webhookData.status !== "paid") {
      return NextResponse.json({ received: true });
    }

    const orderId = webhookData.orderId || webhookData.metadata?.orderId;
    if (!orderId) {
      console.error("No orderId in webhook payload");
      return NextResponse.json({ received: true });
    }

    // Update order status and create tickets
    const order = await (prisma.order.update({
      where: { id: orderId },
      data: { 
        status: "PAID",
        paidAt: new Date() as any, // Type assertion until Prisma Client is regenerated
        paymentRef: webhookData.paymentId,
      } as any,
      include: {
        items: {
          include: {
              ticketLot: true,
          },
        },
        event: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }) as any) as {
      id: string;
      userId: string;
      eventId: string;
      items: Array<{
        quantity: number;
        ticketLotId: string;
        ticketLot: {
          id: string;
        };
      }>;
      user: {
        id: string;
        name: string | null;
        email: string;
      };
    };

    // Get attendees from order (in production, store this separately)
    // For MVP, we'll need to retrieve attendees from a temporary storage
    // For now, using a simplified approach where we create tickets with buyer info
    
    // Create tickets for each item
    for (const item of order.items) {
      // In production, retrieve attendees from OrderItemAttendee table or similar
      // For now, creating tickets with buyer as attendee (simplified)
      const qty = item.quantity;
      
      for (let i = 0; i < qty; i++) {
        const code = generateTicketCode();
        const qrPayload = getQRPayload({ ticketId: '', code }); // Will be updated after creation
        
        const ticket = await prisma.ticket.create({
          data: {
            eventId: order.eventId,
            orderId: order.id,
            ticketLotId: item.ticketLotId,
            userId: order.userId,
            code,
            qrPayload,
          },
        });
        
        // Update QR payload with ticket ID
        const finalQRPayload = getQRPayload({ ticketId: ticket.id, code });
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: { qrPayload: finalQRPayload },
        });
      }

      // Update quantity sold
      await prisma.ticketLot.update({
        where: { id: item.ticketLotId },
        data: {
          quantitySold: {
            increment: qty,
          },
        },
      });
    }

    // Send email with tickets
    await sendTicketsEmail(orderId);
    
    console.log(`Order ${orderId} paid, tickets issued`);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
