import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePromoter } from "@/lib/auth/guards";
import {
    assertPromoterEventAccess,
    canEditTicketInventory,
    TicketManagementAccessError,
} from "@/lib/auth/ticket-management";
import { EventArtistService } from "@/lib/services/event-artist.service";

const slugRegex = /^[a-z0-9-]+$/;

const createSchema = z.object({
    name: z.string().min(2),
    slug: z.string().min(2).regex(slugRegex, "Slug inválido"),
    imageUrl: z.string().optional().or(z.literal("")),
    bio: z.string().optional(),
    performanceAt: z.string().transform((s) => new Date(s)),
    venue: z.string().optional(),
    sortOrder: z.number().int().optional(),
    badgeLabel: z.string().optional(),
    priceCents: z.number().int().min(0),
    capacity: z.number().int().positive(),
    lotName: z.string().optional(),
});

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { session, role, orgId, userId } = await requirePromoter();
        const globalRole = (session.user as { role?: string }).role;
        const { id: eventId } = await params;

        await assertPromoterEventAccess(eventId, orgId, globalRole || "", userId);

        const artists = await EventArtistService.getByEvent(eventId);
        return NextResponse.json({
            artists,
            meta: { canEdit: canEditTicketInventory(globalRole, role) },
        });
    } catch (error: unknown) {
        if (error instanceof TicketManagementAccessError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        const message = error instanceof Error ? error.message : "Erro";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { session, role, orgId, userId } = await requirePromoter();
        const globalRole = (session.user as { role?: string }).role;

        if (!canEditTicketInventory(globalRole, role)) {
            return NextResponse.json(
                { error: "Apenas o proprietário da organização ou administrador pode gerir artistas." },
                { status: 403 }
            );
        }

        const { id: eventId } = await params;
        await assertPromoterEventAccess(eventId, orgId, globalRole || "", userId);

        const body = createSchema.parse(await req.json());
        const result = await EventArtistService.create(eventId, {
            ...body,
            imageUrl: body.imageUrl || null,
            bio: body.bio ?? null,
            venue: body.venue ?? null,
            badgeLabel: body.badgeLabel ?? null,
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0]?.message ?? "Dados inválidos" }, { status: 400 });
        }
        if (error instanceof TicketManagementAccessError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        const message = error instanceof Error ? error.message : "Erro ao criar artista";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
