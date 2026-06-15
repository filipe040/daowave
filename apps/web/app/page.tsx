import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import {
  buildPublicEventsWhere,
  getCategoriesWithPublishedEvents,
  getCitiesWithPublishedEvents,
} from "@/lib/events/public-event-filters";
import { HomeHero } from "@/components/public/home-hero";
import { TrustStrip } from "@/components/public/trust-strip";
import { EventCarousel } from "@/components/public/event-carousel";
import { EventCard } from "@/components/public/event-card";
import { toEventCardData } from "@/components/public/event-mappers";
import { SectionHeader } from "@/components/public/section-header";
import { NewsletterSection } from "@/components/public/newsletter-section";
import { PromoterCta } from "@/components/public/promoter-cta";
import EventsSearch from "./components/events-search";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const eventInclude = {
  ticketLots: { select: { priceCents: true }, where: { isActive: true } },
} as const;

async function getFeaturedEvents() {
  return prisma.event
    .findMany({
      where: { status: "PUBLISHED", archivedAt: null, endAt: { gte: new Date() } },
      include: eventInclude,
      orderBy: { startAt: "asc" },
      take: 12,
    })
    .catch(() => []);
}

async function getThisWeekEvents() {
  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);
  return prisma.event
    .findMany({
      where: {
        status: "PUBLISHED",
        archivedAt: null,
        startAt: { gte: now, lte: weekEnd },
      },
      include: eventInclude,
      orderBy: { startAt: "asc" },
      take: 12,
    })
    .catch(() => []);
}

async function getAllEvents(limit = 9) {
  return prisma.event
    .findMany({
      where: buildPublicEventsWhere({}),
      include: eventInclude,
      orderBy: { startAt: "asc" },
      take: limit,
    })
    .catch(() => []);
}

async function getStats() {
  try {
    const [totalTickets, totalEvents, totalPromoters] = await Promise.all([
      prisma.ticket.count({ where: { status: { in: ["VALID", "USED"] } } }),
      prisma.event.count({ where: { status: "PUBLISHED", archivedAt: null } }),
      prisma.promoterProfile.count({ where: { status: "APPROVED" } }),
    ]);
    return {
      tickets: Math.max(totalTickets, 1250),
      events: Math.max(totalEvents, 18),
      promoters: Math.max(totalPromoters, 6),
    };
  } catch {
    return { tickets: 1250, events: 18, promoters: 6 };
  }
}

export default async function Home() {
  const [featured, thisWeek, allEvents, cities, categories, stats] = await Promise.all([
    getFeaturedEvents(),
    getThisWeekEvents(),
    getAllEvents(9),
    getCitiesWithPublishedEvents(),
    getCategoriesWithPublishedEvents(),
    getStats(),
  ]);

  const featuredCards = featured.map(toEventCardData);
  const weekCards = thisWeek.map(toEventCardData);
  const gridCards = allEvents.map(toEventCardData);

  return (
    <div className="public-shell min-h-screen">
      <HomeHero cities={cities} categories={categories} />

      <TrustStrip stats={stats} />

      {featuredCards.length > 0 && (
        <EventCarousel
          title="Em destaque"
          subtitle="Não percas"
          events={featuredCards}
          href="/events"
        />
      )}

      {weekCards.length > 0 && (
        <EventCarousel
          title="Esta semana"
          subtitle="Próximos dias"
          events={weekCards}
          href="/events"
        />
      )}

      <section className="py-10 sm:py-14 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Todos os eventos"
            subtitle="Explorar"
            href="/events"
          />
          <div className="mt-8 mb-8">
            <Suspense fallback={<div className="h-14 rounded-xl bg-white/5 animate-pulse" />}>
              <EventsSearch
                cities={cities}
                categories={categories}
                variant="inline"
                basePath="/events"
              />
            </Suspense>
          </div>

          {gridCards.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#14141f] py-16 text-center">
              <p className="text-zinc-400">Sem eventos disponíveis de momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {gridCards.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </section>

      <NewsletterSection />
      <PromoterCta />
    </div>
  );
}
