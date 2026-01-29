import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const UpdateSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  slug: z.string().min(3).max(255).optional(),
  description: z.string().optional().nullable(),
  venue: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  coverImage: z.string().url().optional().nullable(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const eventId = params.id;

  // Check promoter ownership
  const promoter = await prisma.promoterProfile.findUnique({ where: { userId: session.user.id } });
  if (!promoter && (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data = UpdateSchema.safeParse(body);
  if (!data.success) {
    return NextResponse.json({ error: data.error.errors[0].message }, { status: 400 });
  }

  try {
    // Ensure promoter owns event unless admin
    const ev = await prisma.event.findUnique({ where: { id: eventId }, select: { promoterId: true } });
    if (!ev) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    if ((session.user as any).role !== "ADMIN" && ev.promoterId !== promoter?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: any = {};
    if (data.data.title !== undefined) updateData.title = data.data.title;
    if (data.data.slug !== undefined) updateData.slug = data.data.slug;
    if (data.data.description !== undefined) updateData.description = data.data.description;
    if (data.data.venue !== undefined) updateData.venue = data.data.venue;
    if (data.data.city !== undefined) updateData.city = data.data.city;
    if (data.data.startAt !== undefined) updateData.startAt = new Date(data.data.startAt);
    if (data.data.endAt !== undefined) updateData.endAt = new Date(data.data.endAt);
    if (data.data.coverImage !== undefined) updateData.coverImage = data.data.coverImage;

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        venue: true,
        city: true,
        startAt: true,
        endAt: true,
        coverImage: true,
      },
    });

    return NextResponse.json({ event: updated });
  } catch (error) {
    console.error("[promotor/events/settings] PATCH error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

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
