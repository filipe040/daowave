import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { safeLog } from "@/lib/security";
import { EventService } from "@/lib/services/event.service";
import { requirePromoter } from "@/lib/auth/guards";
import { MarketingService } from "@/lib/services/marketing";
import { TicketAlertService } from "@/lib/services/ticket-alert.service";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { session, orgId } = await requirePromoter();
    const globalRole = (session.user as any).role;
    const { id } = await props.params;

    // Load the event
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        ticketLots: { select: { quantityTotal: true, quantitySold: true } },
        artists: { where: { isPublished: true }, select: { id: true } },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
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
        return NextResponse.json({ error: "Sem permissão para publicar este evento" }, { status: 403 });
      }
    }

    if (event.status === "PUBLISHED") {
      return NextResponse.json({ error: "O evento já está publicado" }, { status: 409 });
    }

    // Validate publishability
    const validation = EventService.validatePublish(event as any, { isAdmin: globalRole === "ADMIN" });
    if (!validation.ok) {
      return NextResponse.json(
        {
          error: "O evento não pode ser publicado — corrija os seguintes campos",
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    if (event.layoutMode === "ARTISTS" && event.artists.length === 0) {
      return NextResponse.json(
        {
          error: "Adicione pelo menos um artista antes de publicar",
          details: [{ field: "artists", message: "Modo artistas requer pelo menos um artista configurado" }],
        },
        { status: 400 }
      );
    }

    const updated = await EventService.publish(id);

    // Fire & forget automated marketing email
    MarketingService.dispatchNewEventCampaign(id).catch(e => console.error(e));

    // Notificar pré-registos se bilhetes já estão à venda
    TicketAlertService.notifyIfTicketsAvailable(id).catch((e) => console.error(e));

    safeLog.info(`Event published: ${id}`, { eventId: id, publishedBy: session.user.id });

    return NextResponse.json(updated);
  } catch (error) {
    safeLog.error("Publish event error", error);
    return NextResponse.json({ error: "Erro interno ao publicar" }, { status: 500 });
  }
}
