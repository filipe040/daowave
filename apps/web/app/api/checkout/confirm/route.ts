import { NextResponse } from "next/server";
import { InventoryService } from "@/lib/services/inventory.service";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { applyRateLimit, RATE_LIMITS } from "@/lib/security";
import { z } from "zod";

const confirmSchema = z.object({
    eventId: z.string().uuid(),
    inventoryHoldIds: z.array(z.string().uuid()).default([]),
    seatHoldIds: z.array(z.string().uuid()).default([]),
    customerData: z.object({
        name: z.string().min(2),
        email: z.string().email()
    }),
    idempotencyKey: z.string().min(10)
});

export async function POST(req: Request) {
    const rateLimitRes = await applyRateLimit(req, RATE_LIMITS.checkout);
    if (rateLimitRes) return rateLimitRes;

    try {
        const body = await req.json();
        const parsed = confirmSchema.parse(body);

        // Idempotency Check
        const existingOrder = await prisma.order.findUnique({
            where: { idempotencyKey: parsed.idempotencyKey }
        });

        if (existingOrder) {
            return NextResponse.json({ success: true, orderId: existingOrder.id, status: existingOrder.status });
        }

        // Inside a real flow, this validates stripe payment intent is success.

        // 1. Confirm Holds in Database (Atomic Update)
        if (parsed.inventoryHoldIds.length > 0) {
            await InventoryService.confirmHolds(parsed.inventoryHoldIds);
        }
        if (parsed.seatHoldIds.length > 0) {
            await InventoryService.confirmSeatHolds(parsed.seatHoldIds);
        }

        // 2. Fetch locked data to construct Order
        const confirmedHolds = await prisma.inventoryHold.findMany({
            where: { id: { in: parsed.inventoryHoldIds } },
            include: { ticketLot: true }
        });

        const totalCents = confirmedHolds.reduce((acc, hold) => acc + (hold.ticketLot.priceCents * hold.qty), 0);

        // 3. Create Order
        // For MVP assuming anonymous checkout assigns to a system guest user or tries to find by email
        let user = await prisma.user.findUnique({ where: { email: parsed.customerData.email } });
        if (!user) {
            // Very simplified: create a shadow account
            user = await prisma.user.create({
                data: {
                    email: parsed.customerData.email,
                    name: parsed.customerData.name,
                    role: "USER"
                }
            });
        }

        const order = await prisma.order.create({
            data: {
                userId: user.id,
                eventId: parsed.eventId,
                totalCents,
                currency: "EUR",
                status: "PAID",
                buyerName: parsed.customerData.name,
                buyerEmail: parsed.customerData.email,
                idempotencyKey: parsed.idempotencyKey,
                paidAt: new Date(),
                // Group items
                items: {
                    create: confirmedHolds.map(h => ({
                        ticketLotId: h.ticketLotId,
                        quantity: h.qty,
                        unitPriceCents: h.ticketLot.priceCents
                    }))
                }
            }
        });

        // 4. Generate Actual Tickets
        const ticketsToCreate = [];
        let seatHoldIndex = 0;

        for (const hold of confirmedHolds) {
            for (let i = 0; i < hold.qty; i++) {
                // If there are seat holds, assign one to this ticket (simplistic 1:1 mapping for MVP)
                const assignedSeatId = seatHoldIndex < parsed.seatHoldIds.length ? parsed.seatHoldIds[seatHoldIndex] : null;

                ticketsToCreate.push({
                    orderId: order.id,
                    eventId: parsed.eventId,
                    userId: user.id,
                    ticketLotId: hold.ticketLotId,
                    seatId: assignedSeatId, // Note: Need a proper seat map strategy here in real life
                    code: `TKT-${crypto.randomBytes(4).toString("hex").toUpperCase()}-${Date.now().toString().slice(-4)}`,
                    qrPayload: "pending",
                    status: "VALID" as const
                });

                if (assignedSeatId) seatHoldIndex++;
            }
        }

        await prisma.ticket.createMany({
            data: ticketsToCreate
        });

        // Generate QR Payloads for signing
        const createdTickets = await prisma.ticket.findMany({ where: { orderId: order.id } });
        for (const t of createdTickets) {
            // Simplification: In a real environment, we use a signed JWT representing the QR payload.
            const payload = JSON.stringify({ id: t.id, code: t.code, eventId: t.eventId });
            await prisma.ticket.update({
                where: { id: t.id },
                data: { qrPayload: payload }
            });
        }

        return NextResponse.json({ success: true, orderId: order.id });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0]?.message || "Dados inválidos" }, { status: 400 });
        }

        console.error("[POST /checkout/confirm] Error:", error);
        return NextResponse.json(
            { error: error.message || "Erro ao concluir a reserva." },
            { status: 500 }
        );
    }
}
