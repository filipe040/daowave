import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requirePromoter } from "@/lib/auth/guards";
import { EventService } from "@/lib/services/event.service";

export const dynamic = "force-dynamic";

const UpdateEventSettingsSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug inválido (apenas letras minúsculas, números e hífens)"),
  description: z.string().min(1, "Descrição é obrigatória"),
  venue: z.string().min(1, "Local é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  coverImage: z.string().url().nullable().optional(),
}).refine((data) => {
  return new Date(data.endAt) > new Date(data.startAt);
}, {
  message: "Data de fim deve ser posterior à data de início",
  path: ["endAt"],
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId, session } = await requirePromoter();
    const globalRole = (session.user as any).role;
    const { id: eventId } = await params;

    // Load the event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Permission check: ADMIN bypasses; 
    // PROMOTER must be in the org or be the legacy owner
    if (globalRole !== "ADMIN") {
      const isInOrg = event.organizationId === orgId;

      let ownsViaProfile = false;
      if (!isInOrg) {
        const promoterProfile = await EventService.getPromoterProfile(session.user.id);
        ownsViaProfile = promoterProfile ? event.promoterId === promoterProfile.id : false;
      }

      if (!isInOrg && !ownsViaProfile) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const body = await request.json().catch(() => ({}));
    const data = UpdateEventSettingsSchema.parse(body);

    // Check slug uniqueness (if changed)
    if (data.slug !== event.slug) {
      const slugExists = await prisma.event.findUnique({
        where: { slug: data.slug },
      });

      if (slugExists) {
        return NextResponse.json(
          { error: "Já existe um evento com este slug" },
          { status: 400 }
        );
      }
    }

    // Update event
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        title: data.title,
        slug: data.slug,
        description: data.description,
        venue: data.venue,
        city: data.city,
        startAt: new Date(data.startAt),
        endAt: new Date(data.endAt),
        coverImage: data.coverImage || null,
      },
    });

    return NextResponse.json({ event: updatedEvent });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("[event-settings] PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
