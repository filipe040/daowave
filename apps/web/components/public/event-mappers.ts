import type { PublicEventCardData } from "./event-card";

export function toEventCardData(event: {
  id: string;
  slug: string;
  title: string;
  city: string;
  venue: string;
  startAt: Date | string;
  bannerUrl?: string | null;
  coverImage?: string | null;
  ticketLots?: { priceCents: number }[];
}): PublicEventCardData {
  const minPriceCents =
    event.ticketLots && event.ticketLots.length > 0
      ? Math.min(...event.ticketLots.map((l) => l.priceCents))
      : null;
  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    city: event.city,
    venue: event.venue,
    startAt: event.startAt,
    bannerUrl: event.bannerUrl,
    coverImage: event.coverImage,
    minPriceCents,
  };
}
