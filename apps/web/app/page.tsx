import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import EventsSearch from "./components/events-search";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getEvents(searchParams: { search?: string; city?: string; category?: string }) {
  const where: any = {
    status: "PUBLISHED",
    archivedAt: null, // Only show non-archived events
    endAt: { gte: new Date() },
  };

  if (searchParams.search) {
    where.OR = [
      { title: { contains: searchParams.search } },
      { description: { contains: searchParams.search } },
      { city: { contains: searchParams.search } },
    ];
  }

  if (searchParams.city && searchParams.city !== "ALL PORTUGAL") {
    where.city = { contains: searchParams.city };
  }

  // Note: Category filtering would require a category field in the Event model
  // For now, we'll skip category filtering

  return await prisma.event.findMany({
    where,
    include: {
      promoter: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
      _count: {
        select: {
          tickets: true,
        },
      },
    },
    orderBy: {
      startAt: "asc",
    },
    take: 50,
  }).catch(() => []);
}

async function getCities() {
  const events = await prisma.event.findMany({
    where: {
      status: "PUBLISHED",
      endAt: { gte: new Date() },
    },
    select: {
      city: true,
    },
    distinct: ["city"],
  }).catch(() => []);

  return events.map((e) => e.city).filter(Boolean).sort();
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; city?: string; category?: string }>;
}) {
  const params = await searchParams;
  const events = await getEvents(params);
  const cities = await getCities();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section - estilo bilheteira (claro, simples) */}
      <section className="border-b border-slate-200 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="space-y-3 md:space-y-4 max-w-xl">
              <p className="text-xs sm:text-sm font-medium text-blue-700 uppercase tracking-[0.18em]">
                PLATAFORMA DE BILHÉTICA ONLINE
              </p>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
                Encontra e compra bilhetes para os melhores eventos.
              </h1>
              <p className="text-sm sm:text-base text-slate-600 max-w-lg">
                Concertos, festivais, desporto, experiências e muito mais, com compra segura e gestão
                de bilhetes digital.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <Link
                  href="/events"
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-md bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  Ver todos os eventos
                </Link>
                <Link
                  href="/promotor/login"
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-md border border-slate-300 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                >
                  Sou promotor
                </Link>
              </div>
            </div>

            {/* Pequeno destaque / estatísticas (placeholder) */}
            <div className="w-full md:w-80 lg:w-96">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 sm:px-5 sm:py-5">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-[0.18em] mb-3">
                  PRÓXIMOS EVENTOS
                </p>
                <p className="text-sm text-slate-600 mb-1">
                  Eventos ativos na plataforma:
                </p>
                <p className="text-3xl font-semibold text-blue-700">
                  {events.length.toString().padStart(2, "0")}
                </p>
                <p className="mt-3 text-xs text-slate-500">
                  Explora a listagem abaixo e filtra por cidade para encontrares o que procuras.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Secção de busca + listagem de eventos */}
      <section className="py-8 sm:py-10 md:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Título + link para ver todos */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6 sm:mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900">
                Próximos eventos
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Filtra por cidade ou pesquisa pelo nome do evento.
              </p>
            </div>
            <Link
              href="/events"
              className="text-sm font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1"
            >
              Ver listagem completa
              <span className="text-base">›</span>
            </Link>
          </div>

          {/* Pesquisa e filtros */}
          <div className="mb-6 sm:mb-8">
            <Suspense fallback={<div className="h-16 rounded-md bg-slate-100 animate-pulse" />}>
              <EventsSearch cities={cities} initialSearch={params.search} initialCity={params.city} />
            </Suspense>
          </div>

          {/* Lista de eventos */}
          {events.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white py-12 text-center">
              <div className="mb-3 text-4xl">📅</div>
              <p className="text-base font-semibold text-slate-800">
                Não encontrámos eventos para os filtros selecionados.
              </p>
              <p className="mt-1 text-sm text-slate-600 max-w-md mx-auto">
                Ajusta a pesquisa ou volta mais tarde. Novos eventos são adicionados regularmente.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {events.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm hover:border-blue-500/70 hover:shadow-md transition-all"
                >
                  {event.coverImage && (
                    <div className="aspect-[16/9] bg-slate-100 relative overflow-hidden">
                      <img
                        src={event.coverImage}
                        alt={event.title}
                        className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-4 sm:p-5">
                    <h3 className="mb-2 line-clamp-2 text-base sm:text-lg font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                      {event.title}
                    </h3>
                    <div className="mb-4 space-y-1.5 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <span className="text-base">📍</span>
                        <span className="line-clamp-1">
                          {event.venue}, {event.city}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-base">📅</span>
                        <span className="line-clamp-2">
                          {new Date(event.startAt).toLocaleDateString("pt-PT", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="mt-auto flex items-center justify-between border-t border-slate-200 pt-3">
                      <span className="truncate text-xs text-slate-500">
                        {event.promoter?.brandName || "Promotor"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 group-hover:text-blue-800">
                        Ver detalhes
                        <span className="text-sm">›</span>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Secção para promotores */}
      <section className="border-t border-slate-200 bg-white py-10 sm:py-12 md:py-14">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900">
              És promotor de eventos?
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600">
              Cria o teu evento, configura bilhética e começa a vender bilhetes online com a nossa
              plataforma.
            </p>
            <div className="mt-5 flex justify-center">
              <Link
                href="/promotor/login"
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                Aceder ao painel de promotor
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
