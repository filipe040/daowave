import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import EventsSearch from "../components/events-search";
import { cityMatchValues, getCitiesWithPublishedEvents } from "@/lib/events/public-event-cities";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getEvents(searchParams: { search?: string; city?: string }) {
  const where: {
    status: "PUBLISHED";
    archivedAt: null;
    endAt: { gte: Date };
    OR?: Array<Record<string, unknown>>;
    city?: { in: string[] };
  } = {
    status: "PUBLISHED",
    archivedAt: null,
    endAt: { gte: new Date() },
  };

  if (searchParams.search?.trim()) {
    const q = searchParams.search.trim();
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
      { city: { contains: q } },
      { venue: { contains: q } },
    ];
  }

  if (searchParams.city && searchParams.city !== "ALL PORTUGAL") {
    where.city = { in: cityMatchValues(searchParams.city) };
  }

  try {
    return await prisma.event.findMany({
      where,
      orderBy: { startAt: "asc" },
      select: {
        id: true,
        title: true,
        slug: true,
        city: true,
        venue: true,
        startAt: true,
        endAt: true,
        bannerUrl: true,
        coverImage: true,
        ticketLots: { select: { priceCents: true }, where: { isActive: true } },
      },
      take: 100,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return [];
  }
}

async function getCities() {
  return getCitiesWithPublishedEvents();
}

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("pt-PT", { style: "currency", currency: "EUR" });
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string; city?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const [events, cities] = await Promise.all([getEvents(params), getCities()]);

  return (
    <div className="min-h-screen mesh-gradient text-neutral-900">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-16">
        <div className="mb-8 sm:mb-10">
          <div className="text-[11px] uppercase tracking-wider text-violet-600 font-bold">
            Listagem de eventos
          </div>
          <h1 className="mt-2 text-3xl sm:text-4xl md:text-5xl font-black text-neutral-900">
            Todos os eventos disponíveis
          </h1>
          <p className="mt-2 text-sm sm:text-[15px] text-neutral-600 max-w-2xl">
            Filtra por cidade ou pesquisa pelo nome do evento.
          </p>
        </div>

        <div className="mb-8">
          <Suspense fallback={<div className="h-14 rounded-2xl border border-neutral-200 bg-white animate-pulse" />}>
            <EventsSearch
              cities={cities}
              initialSearch={params.search}
              initialCity={params.city}
              basePath="/events"
            />
          </Suspense>
        </div>

        {events.length === 0 ? (
          <div className="rounded-3xl border border-neutral-200 bg-white p-10 sm:p-14 text-center shadow-md">
            <Calendar className="h-14 w-14 text-neutral-300 mx-auto mb-4" strokeWidth={1.5} />
            <p className="text-[15px] sm:text-[16px] font-bold text-neutral-800">
              {params.search || params.city
                ? "Nenhum evento encontrado para estes filtros."
                : "Nenhum evento disponível neste momento."}
            </p>
            <p className="mt-2 text-sm text-neutral-500 max-w-md mx-auto">
              {params.search || params.city
                ? "Ajusta a pesquisa ou limpa os filtros."
                : "Volta mais tarde para descobrir novos eventos na plataforma."}
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-neutral-500 mb-4">
              {events.length} evento{events.length !== 1 ? "s" : ""} encontrado{events.length !== 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {events.map((event) => {
                const minPrice = event.ticketLots.length
                  ? Math.min(...event.ticketLots.map((l) => l.priceCents))
                  : null;
                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.slug}`}
                    className="group relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-md hover:shadow-xl hover:border-violet-200 hover:-translate-y-1 transition-all duration-200 active:scale-[0.99]"
                  >
                    {(event.bannerUrl || event.coverImage) && (
                      <div className="relative aspect-[16/9] overflow-hidden bg-neutral-100">
                        <Image
                          src={event.bannerUrl || event.coverImage!}
                          alt={event.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                          unoptimized
                        />
                      </div>
                    )}

                    <div className="p-5 sm:p-6">
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 border border-violet-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-violet-700">
                          <MapPin className="h-3 w-3" />
                          {event.city || "—"}
                        </span>
                        <span className="h-9 w-9 rounded-xl flex items-center justify-center border border-neutral-200 bg-neutral-50 text-neutral-500 group-hover:bg-violet-50 group-hover:border-violet-200 group-hover:text-violet-600 transition">
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>

                      <h2 className="text-[18px] sm:text-[20px] font-bold text-neutral-900 leading-snug line-clamp-2">
                        {event.title}
                      </h2>

                      <div className="mt-5 space-y-3 text-[13px] text-neutral-600">
                        {event.venue && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-violet-500 shrink-0" />
                            <span className="font-medium truncate">{event.venue}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-violet-500 shrink-0" />
                          <span className="font-medium">
                            {format(new Date(event.startAt), "dd MMM yyyy, HH:mm", { locale: pt })}
                          </span>
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-neutral-100 flex items-center justify-between">
                        {minPrice != null ? (
                          <span className="text-[14px] font-bold text-violet-700">
                            Desde {formatPrice(minPrice)}
                          </span>
                        ) : (
                          <span className="text-[13px] text-neutral-500">Consultar preço</span>
                        )}
                        <span className="inline-flex items-center gap-2 text-[13px] font-bold text-violet-600 group-hover:translate-x-1 transition-transform">
                          Ver detalhes <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
