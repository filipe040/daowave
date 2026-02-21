import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { EventService } from "@/lib/services/event.service";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { z } from "zod";
import { requirePromoter } from "@/lib/auth/guards";

const createEventSchema = z.object({
  title: z.string().min(3, "Título demasiado curto"),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, "Slug inválido (use apenas letras minúsculas, números e hífens)"),
  description: z.string().default(""),
  venue: z.string().min(1, "Local obrigatório"),
  city: z.string().min(1, "Cidade obrigatória"),
  startAt: z.string().transform(str => new Date(str)),
  endAt: z.string().transform(str => new Date(str)),
  orgId: z.string().optional(), // optional: promotor without org can still create
});

export async function GET(req: NextRequest) {
  try {
    const { orgId } = await requirePromoter();

    if (!orgId) {
      return NextResponse.json({ events: [], total: 0, pages: 0 });
    }

    const page = Number(req.nextUrl.searchParams.get("page")) || 1;
    const data = await EventService.getByOrganization(orgId, page);

    return NextResponse.json(data);
  } catch (error) {
    console.error("[Get Events] Error:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string }).role;
  if (role !== "PROMOTER" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const json = await req.json();
    const body = createEventSchema.parse(json);

    // If orgId provided: validate access (non-ADMIN must be OWNER or MANAGER)
    if (body.orgId && role !== "ADMIN") {
      const membership = await prisma.organizationMember.findFirst({
        where: {
          organizationId: body.orgId,
          userId: session.user.id,
          role: { in: ["OWNER", "MANAGER"] },
        },
      });
      if (!membership) {
        return NextResponse.json({ error: "Sem permissão para criar eventos nesta organização" }, { status: 403 });
      }
    }

    // Resolve promoter profile id (needed for EventService.create)
    const promoter = await prisma.promoterProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!promoter && !body.orgId) {
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
      startAt: body.startAt,
      endAt: body.endAt,
      organizationId: body.orgId,
      promoterId: promoter?.id ?? session.user.id, // fallback to userId for admin
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
