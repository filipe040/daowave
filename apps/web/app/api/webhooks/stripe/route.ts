import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { generateQrNonce } from "@/lib/qr";
import { EmailService } from "@/lib/email-service";
import { getEmailConfig } from "@/lib/config/email";
import { InventoryService } from "@/lib/services/inventory.service";
import crypto from "crypto";
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

    // Update order status and payment record within a transaction
    const order = await prisma.$transaction(async (tx) => {
      // 1. Mark Payment as SUCCEEDED if it exists
      await tx.payment.updateMany({
        where: { providerReference: paymentIntent.id },
        data: { status: "SUCCEEDED" },
      });

      // 2. Fetch the Order to get the userId and eventId
      const targetOrder = await tx.order.findUnique({
        where: { id: orderId }
      });

      if (targetOrder) {
        // Find matching active holds for this user & event
        const holds = await tx.inventoryHold.findMany({
          where: {
            userId: targetOrder.userId,
            eventId: targetOrder.eventId,
            status: "ACTIVE"
          },
          select: { id: true }
        });

        if (holds.length > 0) {
          const holdIds = holds.map(h => h.id);
          // Confirm the holds (this updates the actual TicketLot capacity internally)
          await InventoryService.confirmHolds(holdIds);
        }
      }

      // 3. Update Order status
      return tx.order.update({
        where: { id: orderId },
        data: {
          status: "PAID",
          paidAt: new Date(),
        },
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
      });
    });

    // Generate tickets with attendee info (using buyer info if available, otherwise order user data)
    let activeKey = await prisma.qrSigningKey.findFirst({
      where: { active: true },
      orderBy: { createdAt: "desc" },
    });

    if (!activeKey) {
      activeKey = await prisma.qrSigningKey.create({
        data: {
          keyId: `key_${crypto.randomBytes(4).toString("hex")}`,
          keySecret: process.env.QR_SECRET || crypto.randomBytes(32).toString("hex"),
          active: true,
        },
      });
      console.log(`[Checkout] Created new active QRSsigningKey: ${activeKey.keyId}`);
    }

    const ticketsToCreate: any[] = [];
    const { signQrPayload } = await import("@ticketing-platform/shared");

    for (const item of order.items) {
      for (let i = 0; i < item.quantity; i++) {
        const qrNonce = generateQrNonce();
        const ticketId = crypto.randomUUID();

        const payload = {
          v: 1 as const,
          tid: ticketId,
          eid: order.eventId,
          n: qrNonce,
          iat: Math.floor(Date.now() / 1000),
          kid: activeKey.keyId,
        };

        const qrPayload = signQrPayload(payload, activeKey.keySecret);

        ticketsToCreate.push({
          id: ticketId,
          eventId: order.eventId,
          orderId: order.id,
          ticketLotId: item.ticketLotId,
          userId: order.userId,
          code: `${crypto.randomBytes(4).toString("hex").toUpperCase()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
          status: "VALID",
          qrPayload,
        });
      }
    }

    let ticketsCount = 0;
    try {
      const batchCreateResult = await prisma.ticket.createMany({
        data: ticketsToCreate,
      });
      ticketsCount = batchCreateResult.count;
    } catch (err) {
      console.error("Failed to create tickets during webhook processing:", err);
      return NextResponse.json({ error: "Failed to generate tickets" }, { status: 500 });
    }

    // Send order confirmation email
    const emailConfig = getEmailConfig();

    try {
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
      });
    } catch (error) {
      console.error("Error sending order confirmation email:", error);
    }

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
    try {
      await EmailService.sendTemplate({
        to: order.user.email,
        templateId: "ticket-delivery",
        variables: {
          name: order.user.name || "Utilizador",
          eventTitle: ev.title,
          eventDate: ev.startAt.toLocaleString("pt-PT"),
          venueName: ev.venue,
          address: `${ev.venue}, ${ev.city}`,
          ticketCount: ticketsCount,
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
      });
    } catch (error) {
      console.error("Error sending ticket email:", error);
    }

    console.log(`Order ${orderId} paid, ${ticketsCount} tickets issued`);
  } else if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const orderId = paymentIntent.metadata.orderId;

    if (orderId) {
      await prisma.$transaction(async (tx) => {
        await tx.payment.updateMany({
          where: { providerReference: paymentIntent.id },
          data: { status: "FAILED" },
        });

        await tx.order.update({
          where: { id: orderId },
          data: { status: "CANCELED" }, // OrderStatus doesn't have FAILED
        });
      });
    }
  }

  return NextResponse.json({ received: true });
}
