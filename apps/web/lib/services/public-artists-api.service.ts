import { prisma } from "../prisma";
import { EventArtistService } from "./event-artist.service";
import {
    formatCurrency,
    formatPerformanceDateTime,
    formatShortDayMonth,
    daysUntil,
} from "../utils";
import { resolveEventLocation } from "../maps";

export type PublicArtistDto = {
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
    bio: string | null;
    performanceAt: string;
    performanceAtFormatted: string;
    shortDate: string;
    daysUntil: number;
    venue: string | null;
    venueDisplay: string;
    locationUrl: string | null;
    mapEmbedUrl: string;
    badgeLabel: string | null;
    price: {
        cents: number | null;
        currency: string;
        formatted: string | null;
    };
    availability: {
        available: number;
        soldOut: boolean;
    };
    urls: {
        ticketPage: string;
        ticketPagePath: string;
    };
};

export type PublicArtistsPayload = {
    version: "1";
    generatedAt: string;
    event: {
        id: string;
        title: string;
        slug: string;
        venue: string;
        city: string;
        layoutMode: string;
        locationUrl: string | null;
        urls: {
            eventPage: string;
            artistsPage: string;
            artistsPagePath: string;
        };
    };
    artists: PublicArtistDto[];
    links: {
        self: string;
        artistsPage: string;
    };
};

function baseUrl(origin?: string | null): string {
    const fromEnv = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL;
    const base = (origin || fromEnv || "http://localhost:3000").replace(/\/$/, "");
    return base;
}

export async function buildPublicArtistsPayload(
    eventSlug: string,
    options?: { origin?: string | null; selfPath?: string }
): Promise<PublicArtistsPayload | null> {
    const data = await EventArtistService.getPublishedByEventSlug(eventSlug);
    if (!data) return null;

    const base = baseUrl(options?.origin);
    const artistsPagePath = `/events/${data.event.slug}/artistas`;

    const artists: PublicArtistDto[] = await Promise.all(
        data.artists.map(async (artist) => {
            const lot = artist.ticketType.ticketLots[0];
            let available = 0;
            let minPriceCents: number | null = lot?.priceCents ?? null;
            const currency = lot?.currency ?? "EUR";

            if (lot) {
                const holds = await prisma.inventoryHold.aggregate({
                    where: {
                        ticketLotId: lot.id,
                        status: "ACTIVE",
                        expiresAt: { gt: new Date() },
                    },
                    _sum: { qty: true },
                });
                const capacity = lot.capacity > 0 ? lot.capacity : lot.quantityTotal;
                available = Math.max(0, capacity - lot.soldCount - (holds._sum.qty || 0));
            }

            const loc = resolveEventLocation(data.event, artist);
            const ticketPagePath = `${artistsPagePath}/${artist.slug}`;

            return {
                id: artist.id,
                name: artist.name,
                slug: artist.slug,
                imageUrl: artist.imageUrl,
                bio: artist.bio,
                performanceAt: artist.performanceAt.toISOString(),
                performanceAtFormatted: formatPerformanceDateTime(artist.performanceAt),
                shortDate: formatShortDayMonth(artist.performanceAt),
                daysUntil: daysUntil(artist.performanceAt),
                venue: artist.venue,
                venueDisplay: loc.venueDisplay,
                locationUrl: loc.locationUrl,
                mapEmbedUrl: loc.mapEmbedUrl,
                badgeLabel: artist.badgeLabel,
                price: {
                    cents: minPriceCents,
                    currency,
                    formatted: minPriceCents != null ? formatCurrency(minPriceCents, currency) : null,
                },
                availability: {
                    available,
                    soldOut: available <= 0,
                },
                urls: {
                    ticketPage: `${base}${ticketPagePath}`,
                    ticketPagePath,
                },
            };
        })
    );

    const selfPath = options?.selfPath ?? `/api/public/v1/events/${eventSlug}/artists`;

    return {
        version: "1",
        generatedAt: new Date().toISOString(),
        event: {
            id: data.event.id,
            title: data.event.title,
            slug: data.event.slug,
            venue: data.event.venue,
            city: data.event.city,
            layoutMode: data.event.layoutMode,
            locationUrl: data.event.locationUrl ?? null,
            urls: {
                eventPage: `${base}/events/${data.event.slug}`,
                artistsPage: `${base}${artistsPagePath}`,
                artistsPagePath,
            },
        },
        artists,
        links: {
            self: `${base}${selfPath}`,
            artistsPage: `${base}${artistsPagePath}`,
        },
    };
}
