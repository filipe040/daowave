import { NextResponse } from "next/server";
import { TicketTypeService } from "@/lib/services/ticket-type.service";
import { requirePromoter } from "@/lib/auth/guards";
import { z } from "zod";
import { safeLog } from "@/lib/security";

const createSchema = z.object({
    name: z.string().min(2),
    description: z.string().optional(),
    requiresSeat: z.boolean().default(false),
    perUserLimit: z.number().int().positive().optional(),
    status: z.enum(["ACTIVE", "PAUSED"]).default("ACTIVE")
});

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requirePromoter(); // Assumes user implies access to the org events
        const { id: eventId } = await params;

        const types = await TicketTypeService.getByEvent(eventId);
        return NextResponse.json({ ticketTypes: types });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: error.message.includes("Não autorizado") ? 401 : 500 });
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { session, role } = await requirePromoter();
        const canManage = ["PROMOTER_OWNER", "PROMOTER_MANAGER", "OWNER", "MANAGER"].includes(role as string) || (session.user as any).role === "ADMIN";

        if (!canManage) {
            return NextResponse.json({ error: "Permissões insuficientes para gerir bilhetes." }, { status: 403 });
        }

        const { id: eventId } = await params;
        const body = await req.json();
        const parsed = createSchema.parse(body);

        const newType = await TicketTypeService.create(eventId, parsed);



        return NextResponse.json({ success: true, ticketType: newType });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Dados inválidos: " + error.errors[0]?.message }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
    }
}
