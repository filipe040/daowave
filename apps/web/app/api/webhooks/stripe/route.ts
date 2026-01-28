import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { generateQrNonce } from "@/lib/qr";
import { EmailService } from "@/lib/email-service";
import { getEmailConfig } from "@/lib/config/email";
import Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const orderId = paymentIntent.metadata.orderId;

    if (!orderId) {
      console.error("No orderId in payment intent metadata");
      return NextResponse.json({ error: "No orderId" }, { status: 400 });
    }

    // Update order status and fetch with related data
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: "PAID",
        paidAt: new Date() as any, // Type assertion until Prisma Client is regenerated
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
    }) as any; // Type assertion until Prisma Client is regenerated

    // Generate tickets with attendee info (using buyer info if available, otherwise order user data)
    const tickets = [];
    const buyerName = (order as any).buyerName || order.user.name || "Participante";
    const buyerEmail = (order as any).buyerEmail || order.user.email;
    
    for (const item of order.items) {
      for (let i = 0; i < item.qty; i++) {
        const qrNonce = generateQrNonce();
        const ticket = await prisma.ticket.create({
          data: {
            eventId: order.eventId,
            orderId: order.id,
            // ticketTypeId removed - not in schema
            ticketLotId: item.ticketLotId,
            holderUserId: order.userId,
            attendeeName: buyerName,
            attendeeEmail: buyerEmail,
            status: "ISSUED",
            qrNonce,
          } as any, // Type assertion until Prisma Client is regenerated
        });
        tickets.push(ticket);
      }

      // Update stock sold
      await prisma.ticketLot.update({
        where: { id: item.ticketLotId },
        data: {
          quantitySold: {
            increment: item.qty,
          },
        },
      });
    }

    // Send order confirmation email
    const emailConfig = getEmailConfig();
    
    await EmailService.sendTemplate({
      to: order.user.email,
      templateId: "order-confirmed",
      variables: {
        name: order.user.name || "Utilizador",
        orderId: order.id,
        eventTitle: order.event.title,
        total: (order.totalCents / 100).toFixed(2),
        currency: order.currency,
      },
      idempotencyKey: `order-confirmed-${order.id}`,
    }).catch((error) => {
      console.error("Error sending order confirmation email:", error);
    });

    // Send ticket delivery email (uses event branding from Protocolo Visual when set)
    const ev = order.event as { 
      title: string; 
      startAt: Date; 
      venue: string; 
      city: string; 
      primaryColor?: string | null;
      secondaryColor?: string | null;
      bannerUrl?: string | null;
    };
    await EmailService.sendTemplate({
      to: order.user.email,
      templateId: "ticket-delivery",
      variables: {
        name: order.user.name || "Utilizador",
        eventTitle: ev.title,
        eventDate: ev.startAt.toLocaleString("pt-PT"),
        venueName: ev.venue,
        address: `${ev.venue}, ${ev.city}`,
        ticketCount: tickets.length,
        branding: (ev.primaryColor != null || ev.secondaryColor != null || ev.bannerUrl != null)
          ? {
              primaryColor: ev.primaryColor ?? undefined,
              secondaryColor: ev.secondaryColor ?? undefined,
              bannerUrl: ev.bannerUrl ?? undefined,
              headerTitle: "O teu bilhete",
            }
          : undefined,
      },
      idempotencyKey: `ticket-delivery-${order.id}`,
    }).catch((error) => {
      console.error("Error sending ticket email:", error);
    });

    console.log(`Order ${orderId} paid, ${tickets.length} tickets issued`);
  } else if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const orderId = paymentIntent.metadata.orderId;

    if (orderId) {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "CANCELED" }, // OrderStatus doesn't have FAILED
      });
    }
  }

  return NextResponse.json({ received: true });
}
