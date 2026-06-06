import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import EventsSearch from "./components/events-search";
import PromoterLink from "./components/PromoterLink";
import {
  buildPublicEventsWhere,
  getCategoriesWithPublishedEvents,
  getCitiesWithPublishedEvents,
} from "@/lib/events/public-event-filters";
import { ArrowRight, Calendar, MapPin, ShieldCheck, Ticket, Users, Zap } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ── Data fetchers ──────────────────────────────────────────────────────────
async function getEvents(searchParams: { search?: string; city?: string; category?: string }) {
  const where = buildPublicEventsWhere(searchParams);
  return prisma.event
    .findMany({
      where,
      include: {
        promoter: { include: { user: { select: { name: true } } } },
        ticketLots: { select: { priceCents: true }, where: { isActive: true } },
        _count: { select: { tickets: true } },
      },
      orderBy: { startAt: "asc" },
      take: 50,
    })
    .catch(() => []);
}

async function getFeaturedEvents() {
  return prisma.event
    .findMany({
      where: { status: "PUBLISHED", archivedAt: null, endAt: { gte: new Date() } },
      include: {
        ticketLots: { select: { priceCents: true }, where: { isActive: true } },
      },
      orderBy: { startAt: "asc" },
      take: 6,
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
      totalTickets: Math.max(totalTickets, 1250),
      totalEvents: Math.max(totalEvents, 18),
      totalPromoters: Math.max(totalPromoters, 6),
    };
  } catch {
    return { totalTickets: 1250, totalEvents: 18, totalPromoters: 6 };
  }
}

async function getCities() {
  return getCitiesWithPublishedEvents();
}

async function getCategories() {
  return getCategoriesWithPublishedEvents();
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function formatDateTimePT(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-PT", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}
function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("pt-PT", { style: "currency", currency: "EUR" });
}
function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

// ── Page ───────────────────────────────────────────────────────────────────
export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string; city?: string; category?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const [events, featured, cities, categories, stats] = await Promise.all([
    getEvents(params),
    getFeaturedEvents(),
    getCities(),
    getCategories(),
    getStats(),
  ]);

  return (
    <div className="min-h-screen mesh-gradient text-neutral-900">

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-neutral-200/60 py-16 sm:py-20 md:py-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-violet-400/20 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-orange-400/15 blur-3xl" />
          <div className="absolute top-1/2 left-0 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
        </div>

        <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-5 py-2 text-[12px] text-violet-700 mb-8">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="uppercase tracking-wider font-bold">Plataforma de bilhetes</span>
          </div>

          <h1 className="text-[42px] sm:text-[60px] md:text-[72px] lg:text-[80px] font-black tracking-tight leading-[1.05] mb-6">
            A tua próxima
            <br />
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-500 bg-clip-text text-transparent">
              experiência começa aqui.
            </span>
          </h1>

          <p className="mt-5 text-[16px] sm:text-[20px] text-neutral-600 max-w-2xl mx-auto leading-relaxed">
            Descobre eventos em Portugal, compra em segundos e entra com QR code.
            Simples. Rápido. Seguro.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/events"
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-full",
                "bg-gradient-to-r from-violet-600 to-fuchsia-500 px-7 py-3.5",
                "text-[14px] font-bold text-white",
                "shadow-lg shadow-violet-500/30",
                "transition-all hover:shadow-xl hover:shadow-violet-500/40 hover:-translate-y-0.5"
              )}
            >
              Ver eventos <ArrowRight className="h-4 w-4" />
            </Link>
            <PromoterLink
              className={cn(
                "inline-flex items-center justify-center rounded-full",
                "border-2 border-neutral-200 bg-white px-7 py-3.5",
                "text-[15px] font-bold text-neutral-800 shadow-sm hover:border-violet-300 hover:bg-violet-50 transition-all"
              )}
            >
              Sou promotor
            </PromoterLink>
          </div>
        </div>
      </section>

      {/* ── TRUST LAYER ────────────────────────────────────────────────────── */}
      <section className="border-b border-neutral-200/60 bg-white/60 backdrop-blur-sm py-10 sm:py-12">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-4 sm:gap-8 text-center mb-8">
            <div>
              <div className="text-[32px] sm:text-[44px] md:text-[52px] font-black text-violet-600 leading-none">
                +{stats.totalTickets.toLocaleString("pt-PT")}
              </div>
              <div className="mt-2 text-[11px] sm:text-[12px] uppercase tracking-widest text-neutral-500 font-semibold">
                Bilhetes vendidos
              </div>
            </div>
            <div>
              <div className="text-[32px] sm:text-[44px] md:text-[52px] font-black text-fuchsia-600 leading-none">
                +{stats.totalEvents}
              </div>
              <div className="mt-2 text-[11px] sm:text-[12px] uppercase tracking-widest text-neutral-500 font-semibold">
                Eventos realizados
              </div>
            </div>
            <div>
              <div className="text-[32px] sm:text-[44px] md:text-[52px] font-black text-orange-500 leading-none">
                +{stats.totalPromoters}
              </div>
              <div className="mt-2 text-[11px] sm:text-[12px] uppercase tracking-widest text-neutral-500 font-semibold">
                Promotores ativos
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-8">
            <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-[13px] font-semibold text-emerald-800">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Compra segura e protegida
            </div>
            <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-[13px] font-semibold text-neutral-700 shadow-sm">
              <span className="text-[15px]">💳</span>
              Visa · Mastercard · MB Way
            </div>
            <Link
              href="/politica-reembolsos"
              className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-[13px] font-semibold text-neutral-700 shadow-sm hover:border-violet-200 hover:bg-violet-50 transition-colors"
            >
              Política de Reembolsos
            </Link>
          </div>
        </div>
      </section>

      {/* ── EVENTOS EM DESTAQUE ─────────────────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="py-12 sm:py-16 border-b border-neutral-200/60 bg-white/40">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-6 sm:mb-8">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-violet-600 font-bold mb-1">Não percas</div>
                <h2 className="text-[22px] sm:text-[28px] font-bold text-neutral-900">Eventos em Destaque</h2>
              </div>
              <Link
                href="/events"
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-violet-600 hover:text-violet-700 transition"
              >
                Ver todos <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {featured.map((event) => {
                const minPrice = event.ticketLots.length
                  ? Math.min(...event.ticketLots.map((l) => l.priceCents))
                  : null;
                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.slug}`}
                    className={cn(
                      "group relative overflow-hidden rounded-3xl",
                      "border border-neutral-200 bg-white",
                      "shadow-md hover:shadow-xl",
                      "transition-all duration-200 hover:border-violet-200 hover:-translate-y-1 active:scale-[0.99]"
                    )}
                  >
                    <div className="relative aspect-[16/9] overflow-hidden bg-neutral-100">
                      {event.bannerUrl || event.coverImage ? (
                        <Image
                          src={event.bannerUrl || event.coverImage!}
                          alt={event.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                          unoptimized
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-100 to-fuchsia-50 flex items-center justify-center">
                          <Ticket className="h-8 w-8 text-violet-300" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    </div>

                    <div className="relative p-5">
                      <h3 className="text-[15px] sm:text-[16px] font-bold text-neutral-900 leading-snug line-clamp-2">
                        {event.title}
                      </h3>

                      <div className="mt-3 space-y-2 text-[14px] text-neutral-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-violet-500 shrink-0" />
                          <span className="line-clamp-1 font-medium">{event.venue}, {event.city}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-violet-500 shrink-0" />
                          <span className="font-medium">{formatDateTimePT(event.startAt)}</span>
                        </div>
                      </div>

                      <div className="mt-5 flex items-center justify-between border-t border-neutral-100 pt-4">
                        {minPrice != null ? (
                          <span className="text-[15px] font-bold text-violet-700">
                            Desde {formatPrice(minPrice)}
                          </span>
                        ) : (
                          <span className="text-[14px] font-medium text-neutral-500">Consultar preço</span>
                        )}
                        <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-violet-600 group-hover:translate-x-1 transition-transform">
                          Ver evento <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── COMO FUNCIONA ───────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 border-b border-neutral-200/60">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-[11px] uppercase tracking-wider text-violet-600 font-bold mb-3">Simples como deve ser</div>
          <h2 className="text-[28px] sm:text-[36px] font-black text-neutral-900 mb-12 sm:mb-20">
            Como funciona
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {[
              { step: "01", icon: Ticket, color: "violet", title: "Escolhe o teu evento", desc: "Navega entre os eventos disponíveis em Portugal e filtra por cidade ou categoria." },
              { step: "02", icon: ShieldCheck, color: "emerald", title: "Compra em segundos", desc: "Pagamento seguro com cartão ou MB Way. Confirmação imediata por email." },
              { step: "03", icon: Zap, color: "orange", title: "Entra com QR Code", desc: "Mostra o teu QR no telemóvel na entrada. Sem impressões, sem filas." },
            ].map((item) => (
              <div key={item.step} className="relative rounded-3xl border border-neutral-200 bg-white p-8 text-left shadow-md hover:shadow-lg hover:border-violet-200 transition-all">
                <div className="flex items-center gap-4 mb-6 pb-4 border-b border-neutral-100">
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    item.color === "violet" ? "bg-violet-100 text-violet-600" :
                    item.color === "emerald" ? "bg-emerald-100 text-emerald-600" :
                    "bg-orange-100 text-orange-600"
                  }`}>
                    <item.icon className="h-6 w-6" strokeWidth={2} />
                  </div>
                  <span className={`text-[14px] font-black tracking-widest ${
                    item.color === "violet" ? "text-violet-600" :
                    item.color === "emerald" ? "text-emerald-600" :
                    "text-orange-600"
                  }`}>PASSO {item.step}</span>
                </div>
                <h3 className="text-[18px] font-bold text-neutral-900 mb-3">{item.title}</h3>
                <p className="text-[15px] text-neutral-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LISTA + FILTROS ─────────────────────────────────────────────────── */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6 sm:mb-8">
            <div>
              <h2 className="text-[22px] sm:text-[26px] font-bold text-neutral-900">
                Todos os eventos
              </h2>
              <p className="mt-1 text-[13px] text-neutral-500">
                Filtra por cidade ou pesquisa pelo nome do evento.
              </p>
            </div>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 text-[13px] font-semibold text-violet-600 hover:text-violet-700 transition"
            >
              Ver listagem completa <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mb-6 sm:mb-8">
            <Suspense fallback={<div className="h-14 rounded-2xl border border-neutral-200 bg-white animate-pulse" />}>
              <EventsSearch
                cities={cities}
                categories={categories}
                initialSearch={params.search}
                initialCity={params.city}
                initialCategory={params.category}
              />
            </Suspense>
          </div>

          {events.length === 0 ? (
            <div className="rounded-3xl border border-neutral-200 bg-white py-14 text-center shadow-md">
              <Calendar className="h-12 w-12 text-neutral-300 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-[14px] font-semibold text-neutral-700">
                Não encontrámos eventos para os filtros selecionados.
              </p>
              <p className="mt-1 text-[13px] text-neutral-500 max-w-md mx-auto">
                Ajusta a pesquisa ou volta mais tarde. Novos eventos entram regularmente.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {events.map((event) => {
                const minPrice = event.ticketLots.length
                  ? Math.min(...event.ticketLots.map((l) => l.priceCents))
                  : null;
                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.slug}`}
                    className={cn(
                      "group relative overflow-hidden rounded-3xl",
                      "border border-neutral-200 bg-white",
                      "shadow-md hover:shadow-xl",
                      "transition-all duration-200 hover:border-violet-200 hover:-translate-y-1 active:scale-[0.99]"
                    )}
                  >
                    {event.bannerUrl || event.coverImage ? (
                      <div className="relative aspect-[16/9] overflow-hidden bg-neutral-100">
                        <Image
                          src={event.bannerUrl || event.coverImage!}
                          alt={event.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                      </div>
                    ) : (
                      <div className="aspect-[16/9] bg-gradient-to-br from-violet-50 to-fuchsia-50" />
                    )}

                    <div className="relative p-5 sm:p-6">
                      <h3 className="text-[16px] sm:text-[17px] font-bold text-neutral-900 leading-snug line-clamp-2">
                        {event.title}
                      </h3>

                      <div className="mt-3 space-y-2 text-[14px] text-neutral-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-violet-500 shrink-0" />
                          <span className="line-clamp-1 font-medium">{event.venue}, {event.city}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-violet-500 shrink-0" />
                          <span className="font-medium">{formatDateTimePT(event.startAt)}</span>
                        </div>
                      </div>

                      <div className="mt-5 flex items-center justify-between border-t border-neutral-100 pt-4">
                        {minPrice != null ? (
                          <span className="text-[15px] font-bold text-violet-700">
                            Desde {formatPrice(minPrice)}
                          </span>
                        ) : (
                          <span className="text-[14px] font-medium text-neutral-500">{event.promoter?.brandName || "Promotor"}</span>
                        )}
                        <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-violet-600 group-hover:translate-x-1 transition-transform">
                          Ver detalhes <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── PROMOTOR CTA ────────────────────────────────────────────────────── */}
      <section className="border-t border-neutral-200/60 py-12 sm:py-16">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-orange-500 p-8 sm:p-12 text-center shadow-xl shadow-violet-500/25">
            <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/20 px-4 py-1.5 text-[11px] text-white mb-5">
                <Users className="h-3 w-3" />
                <span className="uppercase tracking-wider font-bold">Para promotores</span>
              </div>
              <h2 className="text-[22px] sm:text-[30px] font-black text-white">
                És promotor de eventos?
              </h2>
              <p className="mt-3 text-[14px] sm:text-[15px] text-white/85 max-w-xl mx-auto leading-relaxed">
                Cria o teu evento, configura a bilhética e começa a vender. Gestão, analytics e
                check-in num só lugar.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <PromoterLink
                  className={cn(
                    "inline-flex items-center justify-center gap-2 rounded-full",
                    "bg-white px-7 py-3.5",
                    "text-[14px] font-bold text-violet-700",
                    "shadow-lg",
                    "transition-all hover:shadow-xl hover:-translate-y-0.5"
                  )}
                >
                  Aceder ao painel <ArrowRight className="h-4 w-4" />
                </PromoterLink>
                <Link
                  href="/sobre-nos"
                  className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/40 bg-white/10 px-7 py-3.5 text-[14px] font-bold text-white hover:bg-white/20 transition-all"
                >
                  Saber mais
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}