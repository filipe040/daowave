import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import EventsSearch from "./components/events-search";
import { ArrowRight, Calendar, MapPin } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getEvents(searchParams: { search?: string; city?: string; category?: string }) {
  const where: any = {
    status: "PUBLISHED",
    archivedAt: null,
    endAt: { gte: new Date() },
  };

  if (searchParams.search) {
    where.OR = [
      { title: { contains: searchParams.search, mode: "insensitive" } },
      { description: { contains: searchParams.search, mode: "insensitive" } },
      { city: { contains: searchParams.search, mode: "insensitive" } },
    ];
  }

  if (searchParams.city && searchParams.city !== "ALL PORTUGAL") {
    where.city = { contains: searchParams.city, mode: "insensitive" };
  }

  return prisma.event
    .findMany({
      where,
      include: {
        promoter: {
          include: {
            user: { select: { name: true } },
          },
        },
        _count: { select: { tickets: true } },
      },
      orderBy: { startAt: "asc" },
      take: 50,
    })
    .catch(() => []);
}

async function getCities() {
  const events = await prisma.event
    .findMany({
      where: {
        status: "PUBLISHED",
        archivedAt: null,
        endAt: { gte: new Date() },
      },
      select: { city: true },
      distinct: ["city"],
    })
    .catch(() => []);

  return events.map((e) => e.city).filter(Boolean).sort();
}

function formatDateTimePT(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string; city?: string; category?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const events = await getEvents(params);
  const cities = await getCities();

  return (
    <div className="min-h-screen bg-black text-white">
      {/* HERO */}
      <section className="relative border-b border-white/10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -right-24 h-96 w-96 rounded-full bg-white/6 blur-3xl" />
          <div className="absolute -bottom-40 -left-24 h-[28rem] w-[28rem] rounded-full bg-white/4 blur-3xl" />
        </div>

        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12 md:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/60 backdrop-blur-xl">
                <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
                <span className="uppercase tracking-wider">Plataforma de bilhética</span>
              </div>

              <h1 className="mt-4 text-[32px] sm:text-[40px] md:text-[48px] font-semibold tracking-tight text-white/92 leading-[1.05]">
                Encontra e compra bilhetes para os melhores eventos.
              </h1>

              <p className="mt-4 text-[14px] sm:text-[15px] text-white/55 max-w-2xl">
                Compra segura, bilhetes digitais e gestão moderna para promotores. Simples para o público,
                sólido para operação.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/events"
                  className={cn(
                    "inline-flex items-center justify-center gap-2 rounded-full",
                    "border border-white/10 bg-white/90 px-5 py-3",
                    "text-[13px] font-semibold text-black/90",
                    "shadow-[0_18px_60px_rgba(0,0,0,.20)]",
                    "transition-all hover:bg-white hover:shadow-[0_18px_60px_rgba(0,0,0,.28)]"
                  )}
                >
                  Ver todos os eventos
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/promotor/login"
                  className={cn(
                    "inline-flex items-center justify-center rounded-full",
                    "border border-white/10 bg-white/5 px-5 py-3",
                    "text-[13px] font-semibold text-white/80 hover:text-white",
                    "hover:bg-white/8 transition-all"
                  )}
                >
                  Sou promotor
                </Link>
              </div>
            </div>

            {/* KPI */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-6 sm:p-7 shadow-[0_18px_60px_rgba(0,0,0,.45)]">
                <div className="text-[11px] uppercase tracking-wider text-white/45">Próximos eventos</div>

                <div className="mt-3 flex items-end justify-between gap-4">
                  <div>
                    <div className="text-[13px] text-white/55">Ativos na plataforma</div>
                    <div className="mt-1 text-[44px] leading-none font-semibold text-white/90">
                      {String(events.length).padStart(2, "0")}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                    <div className="text-[11px] uppercase tracking-wider text-white/45">Dica</div>
                    <div className="mt-1 text-[12px] text-white/55">
                      Usa pesquisa + cidade para afinar resultados.
                    </div>
                  </div>
                </div>

                <div className="mt-5 h-px bg-white/10" />

                <div className="mt-4 text-[12px] text-white/55">
                  Compra em segundos. Check-in rápido. Relatórios para promotores.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LISTA + FILTROS */}
      <section className="py-10 sm:py-12">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6 sm:mb-8">
            <div>
              <h2 className="text-[22px] sm:text-[26px] font-semibold text-white/90">
                Próximos eventos
              </h2>
              <p className="mt-1 text-[13px] text-white/55">
                Filtra por cidade ou pesquisa pelo nome do evento.
              </p>
            </div>

            <Link
              href="/events"
              className="inline-flex items-center gap-2 text-[13px] font-semibold text-white/75 hover:text-white transition"
            >
              Ver listagem completa <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mb-6 sm:mb-8">
            <Suspense
              fallback={<div className="h-14 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl animate-pulse" />}
            >
              <EventsSearch cities={cities} initialSearch={params.search} initialCity={params.city} />
            </Suspense>
          </div>

          {events.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl py-14 text-center shadow-[0_18px_60px_rgba(0,0,0,.45)]">
              <div className="mb-3 text-4xl">📅</div>
              <p className="text-[14px] font-semibold text-white/85">
                Não encontrámos eventos para os filtros selecionados.
              </p>
              <p className="mt-1 text-[13px] text-white/55 max-w-md mx-auto">
                Ajusta a pesquisa ou volta mais tarde. Novos eventos entram regularmente.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {events.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}`}
                  className={cn(
                    "group relative overflow-hidden rounded-3xl",
                    "border border-white/10 bg-white/4 backdrop-blur-2xl",
                    "shadow-[0_18px_60px_rgba(0,0,0,.35)]",
                    "transition-all duration-200 hover:bg-white/6 hover:border-white/16 active:scale-[0.99]"
                  )}
                >
                  <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/6 blur-3xl" />
                  </div>

                  {event.coverImage ? (
                    <div className="relative aspect-[16/9] overflow-hidden bg-white/5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={event.coverImage}
                        alt={event.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                    </div>
                  ) : (
                    <div className="aspect-[16/9] bg-white/5" />
                  )}

                  <div className="relative p-5 sm:p-6">
                    <h3 className="text-[16px] sm:text-[17px] font-semibold text-white/92 leading-snug line-clamp-2">
                      {event.title}
                    </h3>

                    <div className="mt-3 space-y-2 text-[12px] text-white/55">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-white/40" />
                        <span className="line-clamp-1">
                          {event.venue}, {event.city}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-white/40" />
                        <span className="line-clamp-1">{formatDateTimePT(event.startAt)}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                      <span className="truncate text-[11px] text-white/45">
                        {event.promoter?.brandName || "Promotor"}
                      </span>
                      <span className="inline-flex items-center gap-2 text-[12px] font-semibold text-white/75 group-hover:text-white transition">
                        Ver detalhes <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* PROMOTER CTA */}
      <section className="border-t border-white/10 py-12 sm:py-14">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-8 sm:p-10 text-center shadow-[0_18px_60px_rgba(0,0,0,.45)]">
            <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-white/6 blur-3xl" />

            <h2 className="relative text-[22px] sm:text-[26px] font-semibold text-white/90">
              És promotor de eventos?
            </h2>
            <p className="relative mt-2 text-[13px] sm:text-[14px] text-white/55 max-w-2xl mx-auto">
              Cria o teu evento, configura bilhética e começa a vender. Operação e analytics num só painel.
            </p>

            <div className="relative mt-6 flex justify-center">
              <Link
                href="/promotor/login"
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-full",
                  "border border-white/10 bg-white/90 px-6 py-3",
                  "text-[13px] font-semibold text-black/90",
                  "shadow-[0_18px_60px_rgba(0,0,0,.20)]",
                  "transition-all hover:bg-white hover:shadow-[0_18px_60px_rgba(0,0,0,.28)]"
                )}
              >
                Aceder ao painel de promotor
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}