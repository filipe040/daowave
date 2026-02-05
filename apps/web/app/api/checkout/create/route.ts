/**
 * POST /api/checkout/create
 * Step 1: Create order PENDING. Body: { eventId, items: [{ ticketLotId (uuid), quantity }] }
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkoutCreateSchema } from "@/lib/security/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = checkoutCreateSchema.parse(body);

    const event = await prisma.event.findUnique({
      where: { id: validated.eventId },
      include: {
        ticketLots: {
          where: { id: { in: validated.items.map((i) => i.ticketLotId) } },
        },
      },
    });

    if (!event || event.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "Event not found or not available" },
        { status: 404 }
      );
    }

    let totalCents = 0;
    const orderItems: Array<{
      ticketLotId: string;
      quantity: number;
      unitPriceCents: number;
    }> = [];

    for (const item of validated.items) {
      const lot = event.ticketLots.find((l) => l.id === item.ticketLotId);
      if (!lot) {
        return NextResponse.json(
          { error: `Ticket lot ${item.ticketLotId} not found` },
          { status: 400 }
        );
      }
      const available = lot.quantityTotal - lot.quantitySold;
      if (item.quantity > available) {
        return NextResponse.json(
          { error: `Insufficient stock for ${lot.name}` },
          { status: 400 }
        );
      }
      orderItems.push({
        ticketLotId: lot.id,
        quantity: item.quantity,
        unitPriceCents: lot.priceCents,
      });
      totalCents += lot.priceCents * item.quantity;
    }

    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        eventId: event.id,
        totalCents,
        currency: "EUR",
        status: "PENDING",
        items: { create: orderItems },
      },
    });

    return NextResponse.json({ orderId: order.id });
  } catch (error: unknown) {
    const err = error as { name?: string; errors?: unknown };
    if (err.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: err.errors },
        { status: 400 }
      );
    }
    console.error("Checkout create error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
