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

const updateSchema = z.object({
    name: z.string().min(2).optional(),
    slug: z.string().min(2).regex(slugRegex).optional(),
    imageUrl: z.string().optional().nullable().or(z.literal("")),
    bio: z.string().optional().nullable(),
    performanceAt: z.string().transform((s) => new Date(s)).optional(),
    venue: z.string().optional().nullable(),
    sortOrder: z.number().int().optional(),
    badgeLabel: z.string().optional().nullable(),
    isPublished: z.boolean().optional(),
    priceCents: z.number().int().min(0).optional(),
    capacity: z.number().int().positive().optional(),
    lotName: z.string().optional(),
});

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string; artistId: string }> }
) {
    try {
        const { session, role, orgId, userId } = await requirePromoter();
        const globalRole = (session.user as { role?: string }).role;

        if (!canEditTicketInventory(globalRole, role)) {
            return NextResponse.json({ error: "Sem permissão para editar artistas." }, { status: 403 });
        }

        const { id: eventId, artistId } = await params;
        await assertPromoterEventAccess(eventId, orgId, globalRole || "", userId);

        const body = updateSchema.parse(await req.json());
        const artist = await EventArtistService.update(artistId, {
            ...body,
            imageUrl: body.imageUrl === "" ? null : body.imageUrl,
        });

        return NextResponse.json(artist);
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0]?.message ?? "Dados inválidos" }, { status: 400 });
        }
        if (error instanceof TicketManagementAccessError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        const message = error instanceof Error ? error.message : "Erro ao atualizar artista";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string; artistId: string }> }
) {
    try {
        const { session, role, orgId, userId } = await requirePromoter();
        const globalRole = (session.user as { role?: string }).role;

        if (!canEditTicketInventory(globalRole, role)) {
            return NextResponse.json({ error: "Sem permissão para apagar artistas." }, { status: 403 });
        }

        const { id: eventId, artistId } = await params;
        await assertPromoterEventAccess(eventId, orgId, globalRole || "", userId);

        await EventArtistService.delete(artistId);
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        if (error instanceof TicketManagementAccessError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        const message = error instanceof Error ? error.message : "Erro ao apagar artista";
        const status = message.includes("Não é possível") ? 400 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
