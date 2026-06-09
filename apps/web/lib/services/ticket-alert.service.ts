import { prisma } from "@/lib/prisma";
import { enqueueTemplate } from "@/lib/email-service";
import { safeLog } from "@/lib/security";

function lotSaleWindow(lot: {
  startsAt: Date | null;
  endsAt: Date | null;
  saleStartAt: Date;
  saleEndAt: Date;
}) {
  return {
    start: lot.startsAt ?? lot.saleStartAt,
    end: lot.endsAt ?? lot.saleEndAt,
  };
}

export class TicketAlertService {
  /** Verifica se existe pelo menos um bilhete comprável agora */
  static async hasAvailableTickets(eventId: string): Promise<boolean> {
    const now = new Date();
    const lots = await prisma.ticketLot.findMany({
      where: { eventId, status: "ACTIVE", isActive: true },
    });

    for (const lot of lots) {
      const { start, end } = lotSaleWindow(lot);
      if (start > now || end < now) continue;

      const capacity = lot.capacity > 0 ? lot.capacity : lot.quantityTotal;
      const sold = lot.soldCount > 0 ? lot.soldCount : lot.quantitySold;
      if (sold < capacity) return true;
    }
    return false;
  }

  /** Próxima data em que bilhetes ficam à venda (se ainda não disponíveis) */
  static async getNextSaleAt(eventId: string): Promise<Date | null> {
    const now = new Date();
    const lots = await prisma.ticketLot.findMany({
      where: { eventId, status: "ACTIVE", isActive: true },
    });

    let next: Date | null = null;
    for (const lot of lots) {
      const { start, end } = lotSaleWindow(lot);
      if (end < now) continue;
      const capacity = lot.capacity > 0 ? lot.capacity : lot.quantityTotal;
      const sold = lot.soldCount > 0 ? lot.soldCount : lot.quantitySold;
      if (sold >= capacity) continue;
      if (start > now) {
        if (!next || start < next) next = start;
      }
    }
    return next;
  }

  static async getPresaveStatus(eventId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { presaveEnabled: true, status: true },
    });
    if (!event || event.status !== "PUBLISHED" || !event.presaveEnabled) {
      return { canPresave: false, hasTicketsNow: false, nextSaleAt: null as string | null };
    }

    const hasTicketsNow = await TicketAlertService.hasAvailableTickets(eventId);
    const nextSaleAt = hasTicketsNow ? null : await TicketAlertService.getNextSaleAt(eventId);

    return {
      canPresave: !hasTicketsNow,
      hasTicketsNow,
      nextSaleAt: nextSaleAt?.toISOString() ?? null,
    };
  }

  static async subscribe(params: {
    eventId: string;
    email: string;
    name?: string;
    userId?: string;
  }) {
    const email = params.email.toLowerCase().trim();
    const event = await prisma.event.findUnique({
      where: { id: params.eventId },
      select: { id: true, status: true, presaveEnabled: true, title: true },
    });

    if (!event || event.status !== "PUBLISHED") {
      throw new Error("Evento não disponível para pré-registo");
    }
    if (!event.presaveEnabled) {
      throw new Error("Pré-registo desactivado para este evento");
    }

    const hasTickets = await TicketAlertService.hasAvailableTickets(params.eventId);
    if (hasTickets) {
      throw new Error("Os bilhetes já estão disponíveis para compra");
    }

    const alert = await prisma.eventTicketAlert.upsert({
      where: { eventId_email: { eventId: params.eventId, email } },
      create: {
        eventId: params.eventId,
        email,
        name: params.name?.trim() || null,
        userId: params.userId ?? null,
        status: "PENDING",
      },
      update: {
        name: params.name?.trim() || undefined,
        userId: params.userId ?? undefined,
        status: "PENDING",
        notifiedAt: null,
      },
    });

    return alert;
  }

  static async unsubscribe(token: string) {
    const alert = await prisma.eventTicketAlert.findUnique({ where: { unsubscribeToken: token } });
    if (!alert) throw new Error("Registo não encontrado");

    await prisma.eventTicketAlert.update({
      where: { id: alert.id },
      data: { status: "UNSUBSCRIBED" },
    });
    return alert;
  }

  /** Envia emails a todos os subscritores pendentes quando bilhetes estão disponíveis */
  static async notifyWaitlist(eventId: string): Promise<{ sent: number; skipped: number }> {
    const hasTickets = await TicketAlertService.hasAvailableTickets(eventId);
    if (!hasTickets) return { sent: 0, skipped: 0 };

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        slug: true,
        venue: true,
        city: true,
        startAt: true,
      },
    });
    if (!event) return { sent: 0, skipped: 0 };

    const pending = await prisma.eventTicketAlert.findMany({
      where: { eventId, status: "PENDING" },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://livepass.pt";
    const eventUrl = `${appUrl}/events/${event.slug}`;
    let sent = 0;
    let skipped = 0;

    for (const alert of pending) {
      const idempotencyKey = `tickets-available-${eventId}-${alert.email}`;

      const result = await enqueueTemplate({
        to: alert.email,
        templateId: "tickets-available",
        idempotencyKey,
        variables: {
          name: alert.name || "Cliente",
          eventTitle: event.title,
          eventDate: event.startAt.toLocaleString("pt-PT", {
            dateStyle: "full",
            timeStyle: "short",
          }),
          venueName: event.venue,
          address: event.city,
          eventUrl,
          unsubscribeUrl: `${appUrl}/api/events/ticket-alert/unsubscribe?token=${alert.unsubscribeToken}`,
        },
      });

      if (result.success) {
        await prisma.eventTicketAlert.update({
          where: { id: alert.id },
          data: { status: "NOTIFIED", notifiedAt: new Date() },
        });
        sent++;
      } else {
        skipped++;
      }
    }

    if (sent > 0) {
      safeLog.info("ticket_alert.waitlist_notified", { eventId, sent, skipped });
    }

    return { sent, skipped };
  }

  /** Cron: processa eventos com subscritores pendentes cujos bilhetes acabaram de ficar disponíveis */
  static async processScheduledAlerts(): Promise<{ events: number; emails: number }> {
    const eventIds = await prisma.eventTicketAlert.findMany({
      where: { status: "PENDING" },
      select: { eventId: true },
      distinct: ["eventId"],
    });

    let events = 0;
    let emails = 0;

    for (const { eventId } of eventIds) {
      const { sent } = await TicketAlertService.notifyWaitlist(eventId);
      if (sent > 0) {
        events++;
        emails += sent;
      }
    }

    return { events, emails };
  }

  /** Chamado após publicar evento ou criar/actualizar lotes */
  static async notifyIfTicketsAvailable(eventId: string) {
    try {
      return await TicketAlertService.notifyWaitlist(eventId);
    } catch (err) {
      safeLog.error("ticket_alert.notify_failed", { eventId, error: err });
      return { sent: 0, skipped: 0 };
    }
  }

  static async countPending(eventId: string) {
    return prisma.eventTicketAlert.count({
      where: { eventId, status: "PENDING" },
    });
  }
}
