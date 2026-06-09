import { prisma } from "@/lib/prisma";

export class EventFavoriteService {
  static async listIds(userId: string): Promise<string[]> {
    const rows = await prisma.eventFavorite.findMany({
      where: { userId },
      select: { eventId: true },
    });
    return rows.map((r) => r.eventId);
  }

  static async isFavorite(userId: string, eventId: string): Promise<boolean> {
    const row = await prisma.eventFavorite.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    return !!row;
  }

  static async toggle(userId: string, eventId: string): Promise<{ favorited: boolean }> {
    const event = await prisma.event.findFirst({
      where: { id: eventId, status: "PUBLISHED", archivedAt: null },
      select: { id: true },
    });
    if (!event) throw new Error("Evento não encontrado");

    const existing = await prisma.eventFavorite.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });

    if (existing) {
      await prisma.eventFavorite.delete({ where: { id: existing.id } });
      return { favorited: false };
    }

    await prisma.eventFavorite.create({ data: { userId, eventId } });
    return { favorited: true };
  }

  static async listForUser(userId: string) {
    const favorites = await prisma.eventFavorite.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            city: true,
            venue: true,
            category: true,
            startAt: true,
            endAt: true,
            bannerUrl: true,
            coverImage: true,
            status: true,
            archivedAt: true,
            ticketLots: {
              where: { isActive: true },
              select: { priceCents: true },
            },
          },
        },
      },
    });

    return favorites
      .map((f) => f.event)
      .filter((e) => e.status === "PUBLISHED" && !e.archivedAt);
  }
}
