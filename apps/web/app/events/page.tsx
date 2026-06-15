import { Suspense } from "react";
import { Calendar } from "lucide-react";
import { prisma } from "@/lib/prisma";
import EventsSearch from "../components/events-search";
import {
  buildPublicEventsWhere,
  getCategoriesWithPublishedEvents,
  getCitiesWithPublishedEvents,
} from "@/lib/events/public-event-filters";
import { EventCard } from "@/components/public/event-card";
import { toEventCardData } from "@/components/public/event-mappers";
import { SectionHeader } from "@/components/public/section-header";
import type { Metadata } from "next";
import { getAppBaseUrl } from "@/lib/company";

export const metadata: Metadata = {
  title: "Eventos",
  description: "Descobre e compra bilhetes para os melhores eventos em Portugal",
  openGraph: {
    title: "Eventos | LivePass",
    description: "Descobre e compra bilhetes para os melhores eventos em Portugal",
    url: `${getAppBaseUrl()}/events`,
  },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getEvents(searchParams: { search?: string; city?: string; category?: string }) {
  try {
    return await prisma.event.findMany({
      where: buildPublicEventsWhere(searchParams),
      orderBy: { startAt: "asc" },
      select: {
        id: true,
        title: true,
        slug: true,
        city: true,
        venue: true,
        startAt: true,
        bannerUrl: true,
        coverImage: true,
        ticketLots: { select: { priceCents: true }, where: { isActive: true } },
      },
      take: 100,
    });
  } catch {
    return [];
  }
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string; city?: string; category?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const [events, cities, categories] = await Promise.all([
    getEvents(params),
    getCitiesWithPublishedEvents(),
    getCategoriesWithPublishedEvents(),
  ]);

  const cards = events.map(toEventCardData);
  const hasFilters = !!(params.search || params.city || params.category);

  return (
    <div className="public-shell min-h-screen">
      <div className="border-b border-white/[0.06] bg-[#0a0a10]/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <SectionHeader
            title={hasFilters ? "Resultados" : "Todos os eventos"}
            subtitle="Bilheteira"
          />
          <p className="mt-3 text-sm text-zinc-400 max-w-2xl">
            Filtra por cidade, género ou pesquisa pelo nome do evento em todo Portugal.
          </p>
          <div className="mt-8">
            <Suspense fallback={<div className="h-14 rounded-xl bg-white/5 animate-pulse" />}>
              <EventsSearch
                cities={cities}
                categories={categories}
                initialSearch={params.search}
                initialCity={params.city}
                initialCategory={params.category}
                basePath="/events"
                variant="inline"
              />
            </Suspense>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {cards.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#14141f] p-12 sm:p-16 text-center">
            <Calendar className="h-12 w-12 text-zinc-600 mx-auto mb-4" strokeWidth={1.5} />
            <p className="text-lg font-bold text-white">
              {hasFilters ? "Nenhum evento encontrado" : "Nenhum evento disponível"}
            </p>
            <p className="mt-2 text-sm text-zinc-500 max-w-md mx-auto">
              {hasFilters
                ? "Ajusta os filtros ou limpa a pesquisa."
                : "Volta em breve — novos eventos são adicionados regularmente."}
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-zinc-500 mb-6">
              {cards.length} evento{cards.length !== 1 ? "s" : ""} encontrado{cards.length !== 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {cards.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
