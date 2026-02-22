import { NextResponse } from "next/server";
import { InventoryService } from "@/lib/services/inventory.service";
import { applyRateLimit, RATE_LIMITS } from "@/lib/security";
import { z } from "zod";

export const dynamic = "force-dynamic";

const seatHoldSchema = z.object({
    eventId: z.string().uuid(),
    seatIds: z.array(z.string().uuid()).min(1),
    guestKey: z.string().min(5).optional()
});

export async function POST(req: Request) {
    const rateLimitRes = await applyRateLimit(req, RATE_LIMITS.checkout);
    if (rateLimitRes) return rateLimitRes;

    try {
        const body = await req.json();
        const parsed = seatHoldSchema.parse(body);

        const userIdOrGuest = parsed.guestKey || "guest_unknown";

        const holds = await InventoryService.holdSeats(
            parsed.eventId,
            userIdOrGuest,
            parsed.seatIds
        );

        return NextResponse.json({
            success: true,
            holds: holds.map(h => ({
                id: h.id,
                seatId: h.seatId,
                expiresAt: h.expiresAt
            }))
        });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0]?.message || "Dados inválidos" }, { status: 400 });
        }

        console.error("[POST /checkout/seat-hold] Error:", error);
        return NextResponse.json(
            { error: error.message || "Erro ao reservar lugares." },
            { status: error.message.includes("já foi vendido") || error.message.includes("reservado") ? 422 : 500 }
        );
    }
}
