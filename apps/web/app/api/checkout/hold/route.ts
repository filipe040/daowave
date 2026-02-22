import { NextResponse } from "next/server";
import { InventoryService } from "@/lib/services/inventory.service";
import { applyRateLimit, RATE_LIMITS } from "@/lib/security";
import { z } from "zod";

const holdSchema = z.object({
    eventId: z.string().uuid(),
    items: z.array(z.object({
        ticketLotId: z.string().uuid(),
        qty: z.number().int().positive()
    })).min(1),
    guestKey: z.string().min(5).optional() // For non-authenticated users
});

export async function POST(req: Request) {
    const rateLimitRes = await applyRateLimit(req, RATE_LIMITS.checkout);
    if (rateLimitRes) return rateLimitRes;

    try {
        const body = await req.json();
        const parsed = holdSchema.parse(body);

        // Get user from session if logged in, otherwise guestKey
        // Mock session extraction here since checkout allows guests
        const userIdOrGuest = parsed.guestKey || "guest_unknown";

        const holds = await InventoryService.holdTickets(
            parsed.eventId,
            userIdOrGuest,
            parsed.items
        );

        return NextResponse.json({
            success: true,
            holds: holds.map(h => ({
                id: h.id,
                ticketLotId: h.ticketLotId,
                qty: h.qty,
                expiresAt: h.expiresAt
            }))
        });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0]?.message || "Dados inválidos" }, { status: 400 });
        }

        console.error("[POST /checkout/hold] Error:", error);
        return NextResponse.json(
            { error: error.message || "Erro ao reservar bilhetes." },
            { status: error.message.includes("Vendas deste lote") || error.message.includes("não tem bilhetes") ? 422 : 500 }
        );
    }
}
