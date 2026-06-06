import { prisma } from "../prisma";

export type CreateEventArtistInput = {
    name: string;
    slug: string;
    imageUrl?: string | null;
    bio?: string | null;
    performanceAt: Date;
    venue?: string | null;
    locationUrl?: string | null;
    sortOrder?: number;
    badgeLabel?: string | null;
    priceCents: number;
    capacity: number;
    lotName?: string;
};

export type UpdateEventArtistInput = Partial<{
    name: string;
    slug: string;
    imageUrl: string | null;
    bio: string | null;
    performanceAt: Date;
    venue: string | null;
    locationUrl: string | null;
    sortOrder: number;
    badgeLabel: string | null;
    isPublished: boolean;
    priceCents: number;
    capacity: number;
    lotName: string;
}>;

export class EventArtistService {
    static async getByEvent(eventId: string) {
        return prisma.eventArtist.findMany({
            where: { eventId },
            orderBy: [{ sortOrder: "asc" }, { performanceAt: "asc" }],
            include: {
                ticketType: {
                    include: {
                        ticketLots: {
                            orderBy: { priceCents: "asc" },
                        },
                    },
                },
            },
        });
    }

    static async getBySlug(eventId: string, slug: string) {
        return prisma.eventArtist.findFirst({
            where: { eventId, slug, isPublished: true },
            include: {
                ticketType: {
                    include: {
                        ticketLots: {
                            where: { status: "ACTIVE" },
                            orderBy: { priceCents: "asc" },
                        },
                    },
                },
                event: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        venue: true,
                        city: true,
                        startAt: true,
                        endAt: true,
                        layoutMode: true,
                        status: true,
                    },
                },
            },
        });
    }

    static async getPublishedByEventSlug(eventSlug: string) {
        const event = await prisma.event.findUnique({
            where: { slug: eventSlug, status: "PUBLISHED" },
            select: {
                id: true,
                title: true,
                slug: true,
                venue: true,
                city: true,
                layoutMode: true,
                locationUrl: true,
            },
        });
        if (!event) return null;

        const artists = await prisma.eventArtist.findMany({
            where: { eventId: event.id, isPublished: true },
            orderBy: [{ sortOrder: "asc" }, { performanceAt: "asc" }],
            include: {
                ticketType: {
                    include: {
                        ticketLots: {
                            where: { status: "ACTIVE" },
                            orderBy: { priceCents: "asc" },
                            take: 1,
                        },
                    },
                },
            },
        });

        return { event, artists };
    }

    static async create(eventId: string, input: CreateEventArtistInput) {
        const event = await prisma.event.findUnique({ where: { id: eventId } });
        if (!event) throw new Error("Evento não encontrado");

        const slugTaken = await prisma.eventArtist.findFirst({
            where: { eventId, slug: input.slug },
        });
        if (slugTaken) throw new Error("Já existe um artista com este slug neste evento");

        return prisma.$transaction(async (tx) => {
            const ticketType = await tx.ticketType.create({
                data: {
                    eventId,
                    name: input.name,
                    description: input.bio ?? null,
                    status: "ACTIVE",
                },
            });

            const lot = await tx.ticketLot.create({
                data: {
                    eventId,
                    ticketTypeId: ticketType.id,
                    name: input.lotName?.trim() || "Bilhete Normal",
                    priceCents: input.priceCents,
                    quantityTotal: input.capacity,
                    capacity: input.capacity,
                    saleStartAt: event.startAt,
                    saleEndAt: event.endAt,
                    status: "ACTIVE",
                },
            });

            const artist = await tx.eventArtist.create({
                data: {
                    eventId,
                    name: input.name,
                    slug: input.slug,
                    imageUrl: input.imageUrl ?? null,
                    bio: input.bio ?? null,
                    performanceAt: input.performanceAt,
                    venue: input.venue ?? null,
                    locationUrl: input.locationUrl ?? null,
                    sortOrder: input.sortOrder ?? 0,
                    badgeLabel: input.badgeLabel ?? null,
                    ticketTypeId: ticketType.id,
                },
                include: {
                    ticketType: { include: { ticketLots: true } },
                },
            });

            if (event.layoutMode !== "ARTISTS") {
                await tx.event.update({
                    where: { id: eventId },
                    data: { layoutMode: "ARTISTS" },
                });
            }

            return { artist, lot };
        });
    }

    static async update(id: string, input: UpdateEventArtistInput) {
        const existing = await prisma.eventArtist.findUnique({
            where: { id },
            include: {
                ticketType: { include: { ticketLots: { take: 1, orderBy: { createdAt: "asc" } } } },
            },
        });
        if (!existing) throw new Error("Artista não encontrado");

        if (input.slug && input.slug !== existing.slug) {
            const slugTaken = await prisma.eventArtist.findFirst({
                where: { eventId: existing.eventId, slug: input.slug, id: { not: id } },
            });
            if (slugTaken) throw new Error("Já existe um artista com este slug neste evento");
        }

        return prisma.$transaction(async (tx) => {
            if (input.name !== undefined || input.bio !== undefined) {
                await tx.ticketType.update({
                    where: { id: existing.ticketTypeId },
                    data: {
                        ...(input.name !== undefined && { name: input.name }),
                        ...(input.bio !== undefined && { description: input.bio }),
                    },
                });
            }

            const primaryLot = existing.ticketType.ticketLots[0];
            if (primaryLot && (input.priceCents !== undefined || input.capacity !== undefined || input.lotName !== undefined)) {
                await tx.ticketLot.update({
                    where: { id: primaryLot.id },
                    data: {
                        ...(input.lotName !== undefined && { name: input.lotName }),
                        ...(input.priceCents !== undefined && { priceCents: input.priceCents }),
                        ...(input.capacity !== undefined && {
                            capacity: input.capacity,
                            quantityTotal: input.capacity,
                        }),
                    },
                });
            }

            return tx.eventArtist.update({
                where: { id },
                data: {
                    ...(input.name !== undefined && { name: input.name }),
                    ...(input.slug !== undefined && { slug: input.slug }),
                    ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl }),
                    ...(input.bio !== undefined && { bio: input.bio }),
                    ...(input.performanceAt !== undefined && { performanceAt: input.performanceAt }),
                    ...(input.venue !== undefined && { venue: input.venue }),
                    ...(input.locationUrl !== undefined && { locationUrl: input.locationUrl }),
                    ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
                    ...(input.badgeLabel !== undefined && { badgeLabel: input.badgeLabel }),
                    ...(input.isPublished !== undefined && { isPublished: input.isPublished }),
                },
                include: {
                    ticketType: { include: { ticketLots: true } },
                },
            });
        });
    }

    static async delete(id: string) {
        const artist = await prisma.eventArtist.findUnique({
            where: { id },
            include: {
                ticketType: {
                    include: {
                        ticketLots: {
                            select: { id: true, soldCount: true, quantitySold: true },
                        },
                    },
                },
            },
        });
        if (!artist) throw new Error("Artista não encontrado");

        const hasSales = artist.ticketType.ticketLots.some(
            (lot) => (lot.soldCount ?? lot.quantitySold ?? 0) > 0
        );
        if (hasSales) {
            throw new Error("Não é possível apagar um artista com bilhetes vendidos.");
        }

        return prisma.$transaction(async (tx) => {
            await tx.inventoryHold.deleteMany({
                where: { ticketLotId: { in: artist.ticketType.ticketLots.map((l) => l.id) } },
            });
            await tx.ticketLot.deleteMany({
                where: { ticketTypeId: artist.ticketTypeId },
            });
            await tx.eventArtist.delete({ where: { id } });
            await tx.ticketType.delete({ where: { id: artist.ticketTypeId } });
        });
    }
}
