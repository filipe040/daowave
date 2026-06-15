import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { EventService } from "@/lib/services/event.service";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { z } from "zod";
import { requirePromoter } from "@/lib/auth/guards";
import { canManageEvents } from "@/lib/auth/member-permissions";

import { isEventCategory } from "@/lib/events/event-categories";

const createEventSchema = z.object({
  title: z.string().min(3, "Título demasiado curto"),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, "Slug inválido (use apenas letras minúsculas, números e hífens)"),
  description: z.string().default(""),
  venue: z.string().min(1, "Local obrigatório"),
  city: z.string().min(1, "Cidade obrigatória"),
  category: z.string().optional().nullable().or(z.literal("")),
  locationUrl: z.string().max(2048).optional().or(z.literal("")),
  startAt: z.string().transform(str => new Date(str)),
  endAt: z.string().transform(str => new Date(str)),
  orgId: z.string().optional(),
  layoutMode: z.enum(["STANDARD", "ARTISTS"]).default("STANDARD"),
});

export async function GET(req: NextRequest) {
  try {
    const { orgId } = await requirePromoter();

    if (!orgId) {
      return NextResponse.json({ events: [], total: 0, pages: 0 });
    }

    const page = Number(req.nextUrl.searchParams.get("page")) || 1;
    const limit = Number(req.nextUrl.searchParams.get("limit")) || 20;
    const search = req.nextUrl.searchParams.get("search") || undefined;
    const status = req.nextUrl.searchParams.get("status") || undefined;
    const data = await EventService.getByOrganization(orgId, page, limit, { search, status });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Get Events] Error:", error);
    return NextResponse.json({ error: error?.message || "Unauthorized", stack: error?.stack }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  const { session, role: memberRole, orgId } = await requirePromoter();
  const globalRole = (session.user as any).role;

  try {
    const json = await req.json();
    const body = createEventSchema.parse(json);

    // If orgId provided: validate access (non-ADMIN must have managerial roles)
    if (body.orgId && globalRole !== "ADMIN") {
      const membership = await prisma.organizationMember.findFirst({
        where: {
          organizationId: body.orgId,
          userId: (session.user as any).id,
        },
      });
      if (!membership || !canManageEvents(membership.role)) {
        return NextResponse.json({ error: "Sem permissão para criar eventos nesta organização" }, { status: 403 });
      }
    }

    // Resolve promoter profile id (needed for EventService.create)
    let promoter = await prisma.promoterProfile.findUnique({
      where: { userId: (session.user as any).id },
    });

    // If missing, create one automatically for organization members or admins
    if (!promoter && (body.orgId || orgId || globalRole === "ADMIN")) {
      promoter = await prisma.promoterProfile.create({
        data: {
          userId: (session.user as any).id,
          brandName: (session.user as any).name || "Provedor de Eventos",
          status: "APPROVED",
        },
      });
    }

    if (!promoter) {
      return NextResponse.json(
        { error: "Precisa de um perfil de promotor ou de selecionar uma organização para criar eventos." },
        { status: 422 }
      );
    }

    const event = await EventService.create({
      title: body.title,
      slug: body.slug,
      description: body.description,
      venue: body.venue,
      city: body.city,
      category: body.category && isEventCategory(body.category) ? body.category : null,
      locationUrl: body.locationUrl || null,
      startAt: body.startAt,
      endAt: body.endAt,
      organizationId: (body.orgId || orgId) ?? undefined,
      promoterId: promoter.id,
      layoutMode: body.layoutMode,
    });

    return NextResponse.json(event);

  } catch (error) {
    if (error instanceof z.ZodError) {
      const first = error.errors[0];
      return NextResponse.json({ error: first?.message ?? "Dados inválidos" }, { status: 400 });
    }
    console.error("[Create Event] Error:", error);
    return NextResponse.json({ error: "Erro interno ao criar evento" }, { status: 500 });
  }
}
