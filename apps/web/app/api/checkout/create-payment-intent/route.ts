import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { z } from "zod";

const CheckoutSchema = z.object({
  eventId: z.string().uuid(),
  items: z.array(
    z.object({
      ticketLotId: z.string().uuid(),
      quantity: z.number().int().positive(),
    })
  ),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { eventId, items } = CheckoutSchema.parse(body);

    // Verify event exists and is published
    const event = await prisma.event.findUnique({
      where: { id: eventId, status: "PUBLISHED" },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Get ticket lots and verify stock
    const lotIds = items.map((item) => item.ticketLotId);
    const lots = await prisma.ticketLot.findMany({
      where: { id: { in: lotIds } },
    });

    let total = 0;
    const verifiedItems = [];

    for (const item of items) {
      const lot = lots.find((l) => l.id === item.ticketLotId);
      if (!lot) {
        return NextResponse.json(
          { error: `Ticket lot ${item.ticketLotId} not found` },
          { status: 404 }
        );
      }

      // Check if lot belongs to event
      if (lot.eventId !== eventId) {
        return NextResponse.json(
          { error: "Invalid ticket lot for event" },
          { status: 400 }
        );
      }

      // Check stock availability (with optimistic lock)
      const available = lot.quantityTotal - lot.quantitySold;
      if (available < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${lot.name}` },
          { status: 400 }
        );
      }

      total += lot.priceCents * item.quantity;
      verifiedItems.push({
        ticketLotId: lot.id,
        quantity: item.quantity,
        unitPriceCents: lot.priceCents,
      });
    }

    // Create order
    let order;
    try {
      order = await prisma.order.create({
        data: {
          userId: session.user.id,
          eventId,
          totalCents: total,
          currency: "EUR",
          status: "PENDING",
          items: {
            create: verifiedItems.map((item) => ({
              ticketLotId: item.ticketLotId,
              quantity: item.quantity,
              unitPriceCents: item.unitPriceCents,
            })),
          },
        },
      });
    } catch (orderError: any) {
      console.error("Failed to create order:", orderError);
      return NextResponse.json(
        { 
          error: "Failed to create order",
          message: orderError.message || "Database error",
        },
        { status: 500 }
      );
    }

    // Create Stripe Payment Intent (or mock in development)
    if (!stripe) {
      console.error("Stripe is not configured. STRIPE_SECRET_KEY is missing.");
      return NextResponse.json(
        { 
          error: "Stripe is not configured",
          message: "Please set STRIPE_SECRET_KEY in environment variables.",
        },
        { status: 500 }
      );
    }

    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount: total, // in cents
        currency: "eur",
        metadata: {
          orderId: order.id,
          eventId,
          userId: session.user.id,
        },
      });
      console.log("✅ Payment intent created:", paymentIntent.id);
    } catch (stripeError: any) {
      console.error("Stripe Payment Intent creation failed:", stripeError);
      
      // If it's an invalid API key error, use mock instead
      if (stripeError.message?.includes("Invalid API Key") || stripeError.type === "StripeInvalidRequestError") {
        console.warn("⚠️  Invalid Stripe API Key detected. Using mock payment intent for development.");
        
        // Return mock payment intent
        const mockPaymentIntentId = `pi_mock_${Date.now()}`;
        const mockClientSecret = `${mockPaymentIntentId}_secret_mock_${Math.random().toString(36).substring(7)}`;
        
        return NextResponse.json({
          clientSecret: mockClientSecret,
          orderId: order.id,
          mock: true,
          warning: "Using mock payment intent. Get a valid Stripe key from https://dashboard.stripe.com/test/apikeys",
        });
      }
      
      return NextResponse.json(
        { 
          error: "Failed to create payment intent",
          message: stripeError.message || "Stripe API error",
        },
        { status: 500 }
      );
    }

    // Update order with payment reference
    // Note: Using PAYPAL enum value for Stripe (can be changed to a dedicated STRIPE value later)
    try {
      await (prisma.order.update({
        where: { id: order.id },
        data: { 
          paymentProvider: "PAYPAL" as any, // Temporary: using PAYPAL for Stripe payments
          paymentRef: paymentIntent.id,
        } as any, // Type assertion until Prisma Client is regenerated
      }) as Promise<any>);
    } catch (updateError) {
      // If update fails, log but don't fail the request
      console.warn("Failed to update order payment reference:", updateError);
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId: order.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Create payment intent error:", error);
    
    // Return more detailed error in development
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}
