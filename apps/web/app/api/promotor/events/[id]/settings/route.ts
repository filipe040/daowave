import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as { role?: string })?.role;
    if (userRole !== "PROMOTER" && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: eventId } = await params;
    const promoter = await prisma.promoterProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!promoter) {
      return NextResponse.json({ error: "Promoter profile not found" }, { status: 404 });
    }

    // Verify event ownership (admins can edit any event)
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        ...(userRole !== "ADMIN" ? { promoterId: promoter.id } : {}),
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
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
