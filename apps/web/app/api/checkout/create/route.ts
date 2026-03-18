/**
 * POST /api/checkout/create
 * Step 1: Create order PENDING. Body: { eventId, items: [{ ticketLotId (uuid), quantity }] }
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkoutCreateSchema } from "@/lib/security/validation";
import { applyRateLimit, RATE_LIMITS } from "@/lib/security";
import { InventoryService } from "@/lib/services/inventory.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const rateLimitResponse = await applyRateLimit(request, RATE_LIMITS.checkout);
    if (rateLimitResponse) return rateLimitResponse;

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const globalRole = (session.user as any).role;
    let isPromoterOrAdmin = globalRole === "ADMIN" || globalRole === "PROMOTER";
    
    if (!isPromoterOrAdmin) {
      const membership = await prisma.organizationMember.findFirst({
        where: { userId: (session.user as any).id }
      });
      if (membership) {
        isPromoterOrAdmin = true;
      }
    }

    if (isPromoterOrAdmin) {
      return NextResponse.json(
        { error: "Administradores e Promotores não podem comprar bilhetes." },
        { status: 403 }
      );
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

    // Attempt to hold inventory securely
    try {
      await InventoryService.holdTickets(
        validated.eventId,
        session.user.id,
        validated.items.map(item => ({
          ticketLotId: item.ticketLotId,
          qty: item.quantity
        }))
      );
    } catch (holdError: any) {
      return NextResponse.json(
        { error: holdError.message || "Estoque insuficiente ou lote inválido" },
        { status: 400 }
      );
    }

    for (const item of validated.items) {
      const lot = event.ticketLots.find((l) => l.id === item.ticketLotId);
      if (!lot) continue; // Should not happen since holdTickets validated

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
