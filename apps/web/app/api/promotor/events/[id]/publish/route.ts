/**
 * POST /api/promotor/events/[id]/publish
 * Publica um evento (muda status para PUBLISHED).
 * - ADMIN: pode publicar qualquer evento
 * - PROMOTER: pode publicar eventos da sua organização ou do seu perfil
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeLog } from "@/lib/security";
import { EventService } from "@/lib/services/event.service";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as { role?: string }).role;
    if (role !== "PROMOTER" && role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Resolve promoter profile (may be null for org-only users)
    const promoterProfile = await prisma.promoterProfile.findUnique({
      where: { userId: session.user.id },
    });

    // Resolve org memberships
    const memberships = await prisma.organizationMember.findMany({
      where: {
        userId: session.user.id,
        role: { in: ["OWNER", "MANAGER"] },
      },
      select: { organizationId: true },
    });
    const orgIds = memberships.map((m) => m.organizationId);

    // Load the event
    const event = await prisma.event.findUnique({
      where: { id },
      include: { ticketLots: { select: { quantityTotal: true, quantitySold: true } } },
    });

    if (!event) {
      return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
    }

    // Permission check: ADMIN bypasses; PROMOTER must own the event or be in the org
    if (role !== "ADMIN") {
      const ownsViaProfile = promoterProfile && event.promoterId === promoterProfile.id;
      const ownsViaOrg = event.organizationId && orgIds.includes(event.organizationId);
      if (!ownsViaProfile && !ownsViaOrg) {
        return NextResponse.json({ error: "Sem permissão para publicar este evento" }, { status: 403 });
      }
    }

    if (event.status === "PUBLISHED") {
      return NextResponse.json({ error: "O evento já está publicado" }, { status: 409 });
    }

    // Validate publishability
    const validation = EventService.validatePublish(event, { isAdmin: role === "ADMIN" });
    if (!validation.ok) {
      return NextResponse.json(
        {
          error: "O evento não pode ser publicado — corrija os seguintes campos",
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    const updated = await EventService.publish(id);

    safeLog.info(`Event published: ${id}`, { eventId: id, publishedBy: session.user.id });

    return NextResponse.json(updated);
  } catch (error) {
    safeLog.error("Publish event error", error);
    return NextResponse.json({ error: "Erro interno ao publicar" }, { status: 500 });
  }
}
