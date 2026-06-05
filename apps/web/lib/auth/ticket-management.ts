import { prisma } from "@/lib/prisma";
import { EventService } from "@/lib/services/event.service";

export function canEditTicketInventory(globalRole?: string, orgRole?: string | null): boolean {
  if (globalRole === "ADMIN") return true;
  return orgRole === "PROMOTER_OWNER" || orgRole === "OWNER";
}

export class TicketManagementAccessError extends Error {
  status: number;
  constructor(message: string, status = 403) {
    super(message);
    this.status = status;
  }
}

export async function assertPromoterEventAccess(
  eventId: string,
  orgId: string | null,
  globalRole: string,
  userId: string
) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, organizationId: true, promoterId: true },
  });

  if (!event) {
    throw new TicketManagementAccessError("Evento não encontrado", 404);
  }

  if (globalRole === "ADMIN") return event;

  const isInOrg = !!orgId && event.organizationId === orgId;
  let ownsViaProfile = false;
  if (!isInOrg) {
    const promoterProfile = await EventService.getPromoterProfile(userId);
    ownsViaProfile = promoterProfile ? event.promoterId === promoterProfile.id : false;
  }

  if (!isInOrg && !ownsViaProfile) {
    throw new TicketManagementAccessError("Sem permissão para aceder a este evento", 403);
  }

  return event;
}
