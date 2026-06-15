import { NextResponse } from "next/server";
import { TicketTypeService } from "@/lib/services/ticket-type.service";
import { requirePromoter } from "@/lib/auth/guards";
import { assertPromoterEventAccess, canEditTicketInventory, TicketManagementAccessError } from "@/lib/auth/ticket-management";
import { canManageTicketContent } from "@/lib/auth/member-permissions";
import { z } from "zod";
import { safeLog } from "@/lib/security";

const createSchema = z.object({
    name: z.string().min(2),
    description: z.string().nullable().optional(),
    requiresSeat: z.boolean().default(false),
    perUserLimit: z.number().int().positive().nullable().optional(),
    status: z.enum(["ACTIVE", "PAUSED"]).default("ACTIVE"),
});

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { session, role, orgId, userId } = await requirePromoter();
        const globalRole = (session.user as { role?: string }).role;
        const { id: eventId } = await params;

        await assertPromoterEventAccess(eventId, orgId, globalRole || "", userId);

        const types = await TicketTypeService.getByEvent(eventId);
        return NextResponse.json({
            ticketTypes: types,
            meta: { canEdit: canEditTicketInventory(globalRole, role) },
        });
    } catch (error: unknown) {
        if (error instanceof TicketManagementAccessError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        const message = error instanceof Error ? error.message : "Erro";
        return NextResponse.json({ error: message }, { status: message.includes("Não autorizado") ? 401 : 500 });
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { session, role } = await requirePromoter();
        const canManage = canManageTicketContent(role) || (session.user as any).role === "ADMIN";

        if (!canManage) {
            return NextResponse.json({ error: "Permissões insuficientes para gerir bilhetes." }, { status: 403 });
        }

        const { id: eventId } = await params;
        const body = await req.json();
        const parsed = createSchema.parse(body);

        const newType = await TicketTypeService.create(eventId, {
            name: parsed.name,
            description: parsed.description ?? undefined,
            requiresSeat: parsed.requiresSeat,
            perUserLimit: parsed.perUserLimit ?? undefined,
            status: parsed.status,
        });



        return NextResponse.json({ success: true, ticketType: newType });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Dados inválidos: " + error.errors[0]?.message }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
    }
}
