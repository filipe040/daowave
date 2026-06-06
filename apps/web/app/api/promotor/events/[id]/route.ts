import { NextResponse } from "next/server";
import { EventService } from "@/lib/services/event.service";
import { NextRequest } from "next/server";
import { z } from "zod";
import { requirePromoter } from "@/lib/auth/guards";

import { isEventCategory } from "@/lib/events/event-categories";

const updateEventSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  venue: z.string().optional(),
  city: z.string().optional(),
  category: z.string().optional().nullable().or(z.literal("")),
  locationUrl: z.string().max(2048).optional().nullable().or(z.literal("")),
  startAt: z.string().transform(str => new Date(str)).optional(),
  endAt: z.string().transform(str => new Date(str)).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CANCELLED']).optional(),
  layoutMode: z.enum(['STANDARD', 'ARTISTS']).optional(),
});

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { orgId, session } = await requirePromoter();

  const event = await EventService.getById(params.id);
  if (!event) return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });

  const isGlobalAdmin = (session.user as any)?.role === "ADMIN";

  // Ownership check
  if (!isGlobalAdmin && event.organizationId !== orgId) {
    // If not matching orgId, check if legacy owner/manager
    const promoter = await EventService.getPromoterProfile((session.user as any).id);
    if (!promoter || event.promoterId !== promoter.id) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
  }

  return NextResponse.json(event);
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { orgId, session } = await requirePromoter();

  try {
    const eventBefore = await EventService.getById(params.id);
    if (!eventBefore) return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });

    const isGlobalAdmin = (session.user as any)?.role === "ADMIN";

    // Ownership check (only OWNER/MANAGER of that org can edit)
    if (!isGlobalAdmin && eventBefore.organizationId !== orgId) {
      const promoter = await EventService.getPromoterProfile((session.user as any).id);
      if (!promoter || eventBefore.promoterId !== promoter.id) {
        return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
      }
    }

    const json = await req.json();
    const body = updateEventSchema.parse(json);

    const updateData = {
      ...body,
      ...(body.category !== undefined && {
        category: body.category && isEventCategory(body.category) ? body.category : null,
      }),
    };
    if (body.status) {
      (updateData as any).status = body.status;
    }

    const event = await EventService.update(params.id, updateData as any);
    return NextResponse.json(event);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("PATCH Event Error:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
