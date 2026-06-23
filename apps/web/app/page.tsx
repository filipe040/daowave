import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  getCategoriesWithPublishedEvents,
  getCitiesWithPublishedEvents,
} from "@/lib/events/public-event-filters";
import { HomeHero } from "@/components/public/home-hero";
import { TrustStrip } from "@/components/public/trust-strip";
import { EventCarousel } from "@/components/public/event-carousel";
import { EventCard } from "@/components/public/event-card";
import { toEventCardData } from "@/components/public/event-mappers";
import { SectionHeader } from "@/components/public/section-header";
import { PromoterCta } from "@/components/public/promoter-cta";
import { NewsletterSection } from "@/components/public/newsletter-section";
import type { Metadata } from "next";
import { getAppBaseUrl } from "@/lib/company";

export const metadata: Metadata = {
  title: "LivePass — Bilhetes para Eventos em Portugal",
  description: "Compra bilhetes digitais seguros para concertos, festivais e eventos. QR instantâneo e check-in em tempo real.",
  openGraph: {
    title: "LivePass — Bilhetes para Eventos",
    description: "Compra bilhetes digitais seguros para os melhores eventos em Portugal",
    url: getAppBaseUrl(),
  },
};

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
      take: 8,
    })
    .catch(() => []);
}

export default async function Home() {
  const [featured, thisWeek, cities, categories] = await Promise.all([
    getFeaturedEvents(),
    getThisWeekEvents(),
    getCitiesWithPublishedEvents(),
    getCategoriesWithPublishedEvents(),
  ]);

  const featuredCards = featured.map(toEventCardData);
  const weekCards = thisWeek.map(toEventCardData);
  const showWeekCarousel = weekCards.length > 0 && weekCards.some((e) => !featuredCards.find((f) => f.id === e.id));

  return (
    <div className="public-shell min-h-screen">
      <Suspense fallback={null}>
        <HomeHero cities={cities} categories={categories} />
      </Suspense>

      <TrustStrip />

      {featuredCards.length > 0 && (
        <EventCarousel
          title="Em destaque"
          subtitle="Não percas"
          events={featuredCards}
          href="/events"
        />
      )}

      {showWeekCarousel && (
        <section className="py-10 sm:py-14 border-t border-white/[0.06]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader title="Esta semana" subtitle="Próximos 7 dias" href="/events" />
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {weekCards.slice(0, 8).map((event) => (
                <EventCard key={event.id} event={event} variant="compact" />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-12 sm:py-16 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-r from-[#0d1b2e] to-[#0c0c12] px-8 py-12 sm:py-16 text-center">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-[#00a0e3]/10 blur-[60px] rounded-full pointer-events-none" />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-black text-white">Explora todos os eventos</h2>
              <p className="mt-3 text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
                Filtra por cidade, género ou pesquisa pelo nome do evento.
              </p>
              <Link
                href="/events"
                className="inline-flex items-center gap-2 mt-8 rounded-full bg-[#00a0e3] px-8 py-3.5 text-sm font-bold text-white hover:bg-[#0090cc] transition-all shadow-xl shadow-[#00a0e3]/25 hover:shadow-[#00a0e3]/40 hover:scale-[1.02]"
              >
                Ver todos os eventos <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PromoterCta />
      <NewsletterSection />
    </div>
  );
}
