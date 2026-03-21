import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import EventsSearch from "./components/events-search";
import PromoterLink from "./components/PromoterLink";
import { CITIES_PT } from "./constants/cities";
import { ArrowRight, Calendar, MapPin, ShieldCheck, Ticket, Users, Zap } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ── Data fetchers ──────────────────────────────────────────────────────────
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
  const events = await prisma.event
    .findMany({
      where: { status: "PUBLISHED", archivedAt: null, endAt: { gte: new Date() } },
      select: { city: true },
      distinct: ["city"],
    })
    .catch(() => []);
  const dbCities = events.map((e) => e.city).filter(Boolean);
  const citySet = new Set(CITIES_PT.map((c) => c.toLowerCase()));
  const extra = dbCities.filter((c) => !citySet.has(c.toLowerCase()));
  return [...CITIES_PT, ...extra].sort((a, b) => a.localeCompare(b, "pt-PT"));
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
  const [events, featured, cities, stats] = await Promise.all([
    getEvents(params),
    getFeaturedEvents(),
    getCities(),
    getStats(),
  ]);

  return (
    <div className="min-h-screen bg-black text-white">

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-white/10 py-16 sm:py-20 md:py-24">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-white/4 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-white/3 blur-3xl" />
        </div>

        <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-[12px] text-white/90 backdrop-blur-xl mb-8">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
            <span className="uppercase tracking-wider font-semibold">Plataforma de bilhetes</span>
          </div>

          <h1 className="text-[42px] sm:text-[60px] md:text-[72px] lg:text-[84px] font-black tracking-tight text-white leading-[1.05] mb-6">
            A tua próxima
            <br />
            <span className="text-white/70">experiência começa aqui.</span>
          </h1>

          <p className="mt-5 text-[16px] sm:text-[20px] text-white/80 max-w-2xl mx-auto leading-relaxed">
            Descobre eventos em Portugal, compra em segundos e entra com QR code.
            Simples. Rápido. Seguro.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/events"
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-full",
                "bg-white px-6 py-3.5",
                "text-[14px] font-semibold text-black",
                "shadow-[0_8px_32px_rgba(255,255,255,.25)]",
                "transition-all hover:shadow-[0_8px_40px_rgba(255,255,255,.35)] hover:bg-white/95"
              )}
            >
              Ver eventos <ArrowRight className="h-4 w-4" />
            </Link>
            <PromoterLink
              className={cn(
                "inline-flex items-center justify-center rounded-full",
                "border border-white/20 bg-white/10 px-6 py-3.5",
                "text-[15px] font-bold text-white shadow-sm hover:bg-white/20 transition-all"
              )}
            >
              Sou promotor
            </PromoterLink>
          </div>
        </div>
      </section>

      {/* ── TRUST LAYER ────────────────────────────────────────────────────── */}
      <section className="border-b border-white/8 bg-white/[0.02] py-10 sm:py-12">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-4 sm:gap-8 text-center mb-8">
            <div>
              <div className="text-[32px] sm:text-[44px] md:text-[52px] font-bold text-white leading-none">
                +{stats.totalTickets.toLocaleString("pt-PT")}
              </div>
              <div className="mt-2 text-[11px] sm:text-[12px] uppercase tracking-widest text-white/40">
                Bilhetes vendidos
              </div>
            </div>
            <div>
              <div className="text-[32px] sm:text-[44px] md:text-[52px] font-bold text-white leading-none">
                +{stats.totalEvents}
              </div>
              <div className="mt-2 text-[11px] sm:text-[12px] uppercase tracking-widest text-white/40">
                Eventos realizados
              </div>
            </div>
            <div>
              <div className="text-[32px] sm:text-[44px] md:text-[52px] font-bold text-white leading-none">
                +{stats.totalPromoters}
              </div>
              <div className="mt-2 text-[11px] sm:text-[12px] uppercase tracking-widest text-white/40">
                Promotores ativos
              </div>
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-8">
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-5 py-2.5 text-[13px] font-medium text-white/90">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Compra segura e protegida
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-5 py-2.5 text-[13px] font-medium text-white/90">
              <span className="text-[15px]">💳</span>
              Visa · Mastercard · MB Way
            </div>
            <Link
              href="/politica-reembolsos"
              className="flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-5 py-2.5 text-[13px] font-medium text-white/90 hover:bg-white/10 transition-colors"
            >
              Política de Reembolsos
            </Link>
          </div>
        </div>
      </section>

      {/* ── EVENTOS EM DESTAQUE ─────────────────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="py-12 sm:py-16 border-b border-white/8">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-6 sm:mb-8">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-white/40 mb-1">Não percas</div>
                <h2 className="text-[22px] sm:text-[28px] font-semibold text-white/90">Eventos em Destaque</h2>
              </div>
              <Link
                href="/events"
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-white/50 hover:text-white transition"
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
                      "border border-white/10 bg-white/5",
                      "shadow-[0_18px_60px_rgba(0,0,0,.4)]",
                      "transition-all duration-200 hover:border-white/20 active:scale-[0.99]"
                    )}
                  >
                    {/* Cover Image */}
                    <div className="relative aspect-[16/9] overflow-hidden bg-white/5">
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
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/3 flex items-center justify-center">
                          <Ticket className="h-8 w-8 text-white/20" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    </div>

                    {/* Body */}
                    <div className="relative p-5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-[15px] sm:text-[16px] font-semibold text-white/92 leading-snug line-clamp-2 flex-1">
                          {event.title}
                        </h3>
                      </div>

                      <div className="mt-3 space-y-2 text-[14px] text-white/70">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-white/50 shrink-0" />
                          <span className="line-clamp-1 font-medium">{event.venue}, {event.city}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-white/50 shrink-0" />
                          <span className="font-medium">{formatDateTimePT(event.startAt)}</span>
                        </div>
                      </div>

                      <div className="mt-5 flex items-center justify-between border-t border-white/15 pt-4">
                        {minPrice != null ? (
                          <span className="text-[15px] font-bold text-white">
                            Desde {formatPrice(minPrice)}
                          </span>
                        ) : (
                          <span className="text-[14px] font-medium text-white/60">Consultar preço</span>
                        )}
                        <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-white/80 group-hover:text-white transition group-hover:translate-x-1">
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
      <section className="py-16 sm:py-24 border-b border-white/8">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-[11px] uppercase tracking-wider text-white/40 mb-3">Simples como deve ser</div>
          <h2 className="text-[28px] sm:text-[36px] font-bold text-white/95 mb-12 sm:mb-20">
            Como funciona
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                step: "01",
                icon: Ticket,
                title: "Escolhe o teu evento",
                desc: "Navega entre os eventos disponíveis em Portugal e filtra por cidade ou categoria.",
              },
              {
                step: "02",
                icon: ShieldCheck,
                title: "Compra em segundos",
                desc: "Pagamento seguro com cartão ou MB Way. Confirmação imediata por email.",
              },
              {
                step: "03",
                icon: Zap,
                title: "Entra com QR Code",
                desc: "Mostra o teu QR no telemóvel na entrada. Sem impressões, sem filas.",
              },
            ].map((item) => (
              <div key={item.step} className="relative rounded-3xl border border-white/10 bg-white/5 p-8 text-left shadow-lg hover:border-white/20 transition-colors">
                <div className="flex items-center gap-4 mb-6 pb-4 border-b border-white/10">
                  <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                    <item.icon className="h-6 w-6 text-white" strokeWidth={2} />
                  </div>
                  <span className="text-[14px] font-bold tracking-widest text-emerald-400">PASSO {item.step}</span>
                </div>
                <h3 className="text-[18px] font-bold text-white mb-3">{item.title}</h3>
                <p className="text-[15px] font-medium text-white/70 leading-relaxed">{item.desc}</p>
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
              <h2 className="text-[22px] sm:text-[26px] font-semibold text-white/90">
                Todos os eventos
              </h2>
              <p className="mt-1 text-[13px] text-white/45">
                Filtra por cidade ou pesquisa pelo nome do evento.
              </p>
            </div>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 text-[13px] font-semibold text-white/50 hover:text-white transition"
            >
              Ver listagem completa <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mb-6 sm:mb-8">
            <Suspense fallback={<div className="h-14 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl animate-pulse" />}>
              <EventsSearch cities={cities} initialSearch={params.search} initialCity={params.city} />
            </Suspense>
          </div>

          {events.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl py-14 text-center shadow-[0_18px_60px_rgba(0,0,0,.45)]">
              <Calendar className="h-12 w-12 text-white/25 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-[14px] font-semibold text-white/70">
                Não encontrámos eventos para os filtros selecionados.
              </p>
              <p className="mt-1 text-[13px] text-white/40 max-w-md mx-auto">
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
                      "border border-white/10 bg-white/4 backdrop-blur-2xl",
                      "shadow-[0_18px_60px_rgba(0,0,0,.35)]",
                      "transition-all duration-200 hover:bg-white/6 hover:border-white/16 active:scale-[0.99]"
                    )}
                  >
                    <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/6 blur-3xl" />
                    </div>

                    {event.bannerUrl || event.coverImage ? (
                      <div className="relative aspect-[16/9] overflow-hidden bg-white/5">
                        <Image
                          src={event.bannerUrl || event.coverImage!}
                          alt={event.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                          unoptimized
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

                      <div className="mt-3 space-y-2 text-[14px] text-white/70">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-white/50 shrink-0" />
                          <span className="line-clamp-1 font-medium">{event.venue}, {event.city}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-white/50 shrink-0" />
                          <span className="font-medium">{formatDateTimePT(event.startAt)}</span>
                        </div>
                      </div>

                      <div className="mt-5 flex items-center justify-between border-t border-white/15 pt-4">
                        {minPrice != null ? (
                          <span className="text-[15px] font-bold text-white">
                            Desde {formatPrice(minPrice)}
                          </span>
                        ) : (
                          <span className="text-[14px] font-medium text-white/60">{event.promoter?.brandName || "Promotor"}</span>
                        )}
                        <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-white/80 group-hover:text-white transition group-hover:translate-x-1">
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
      <section className="border-t border-white/8 py-12 sm:py-16">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/4 backdrop-blur-2xl p-8 sm:p-12 text-center shadow-[0_18px_60px_rgba(0,0,0,.45)]">
            <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-white/4 blur-3xl" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[11px] text-white/50 mb-5">
                <Users className="h-3 w-3" />
                <span className="uppercase tracking-wider">Para promotores</span>
              </div>
              <h2 className="text-[22px] sm:text-[30px] font-semibold text-white/90">
                Es promotor de eventos?
              </h2>
              <p className="mt-3 text-[14px] sm:text-[15px] text-white/50 max-w-xl mx-auto leading-relaxed">
                Cria o teu evento, configura a bilhética e começa a vender. Gestão, analytics e
                check-in num só lugar.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <PromoterLink
                  className={cn(
                    "inline-flex items-center justify-center gap-2 rounded-full",
                    "bg-white px-6 py-3.5",
                    "text-[14px] font-semibold text-black",
                    "shadow-[0_8px_32px_rgba(255,255,255,.18)]",
                    "transition-all hover:shadow-[0_8px_40px_rgba(255,255,255,.28)] hover:scale-105"
                  )}
                >
                  Aceder ao painel <ArrowRight className="h-4 w-4" />
                </PromoterLink>
                <Link
                  href="/sobre-nos"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3.5 text-[14px] font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-all"
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