import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { cityMatchValues } from "@/lib/events/public-event-filters";
import { ArrowLeft, Calendar, MapPin, ArrowRight, Ticket } from "lucide-react";

export const dynamic = "force-dynamic";

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

async function getEventsByCity(cidade: string) {
    const cityName = decodeURIComponent(cidade).trim();
    return prisma.event.findMany({
        where: {
            status: "PUBLISHED",
            archivedAt: null,
            endAt: { gte: new Date() },
            city: { in: cityMatchValues(cityName) },
        },
        include: {
            ticketLots: { select: { priceCents: true }, where: { isActive: true } },
        },
        orderBy: { startAt: "asc" },
    }).catch(() => []);
}

export async function generateMetadata({ params }: { params: Promise<{ cidade: string }> }) {
    const { cidade } = await params;
    const cityName = decodeURIComponent(cidade);
    const capitalized = cityName.charAt(0).toUpperCase() + cityName.slice(1).toLowerCase();
    return {
        title: `Eventos em ${capitalized} — Bilhetes Online | LivePass`,
        description: `Compra bilhetes para os melhores eventos em ${capitalized}. Eventos de música, cultura e entretenimento com compra segura e QR code.`,
        openGraph: {
            title: `Eventos em ${capitalized} | LivePass`,
            description: `Descobre e compra bilhetes para eventos em ${capitalized}.`,
        },
    };
}

export default async function EventosPorCidadePage({
    params,
}: {
    params: Promise<{ cidade: string }>;
}) {
    const { cidade } = await params;
    const cityName = decodeURIComponent(cidade);
    const capitalized = cityName.charAt(0).toUpperCase() + cityName.slice(1).toLowerCase();
    const events = await getEventsByCity(cidade);

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: `Eventos em ${capitalized}`,
        numberOfItems: events.length,
        itemListElement: events.map((ev, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: {
                "@type": "Event",
                name: ev.title,
                startDate: ev.startAt.toISOString(),
                endDate: ev.endAt.toISOString(),
                location: {
                    "@type": "Place",
                    name: ev.venue,
                    address: { "@type": "PostalAddress", addressLocality: ev.city, addressCountry: "PT" },
                },
                url: `https://tickets.daowave.pt/events/${ev.slug}`,
            },
        })),
    };

    return (
        <div className="min-h-screen mesh-gradient text-neutral-900">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
                <Link
                    href="/events"
                    className="inline-flex items-center gap-2 text-[13px] text-neutral-500 hover:text-violet-700 transition mb-8"
                >
                    <ArrowLeft className="h-4 w-4" /> Todos os eventos
                </Link>

                <div className="mb-8">
                    <div className="text-[11px] uppercase tracking-wider text-neutral-500 mb-1">Por cidade</div>
                    <h1 className="text-[28px] sm:text-[36px] font-bold text-neutral-900">
                        Eventos em {capitalized}
                    </h1>
                    <p className="mt-2 text-[14px] text-neutral-600">
                        {events.length > 0
                            ? `${events.length} evento${events.length !== 1 ? "s" : ""} disponível${events.length !== 1 ? "eis" : ""}`
                            : "Nenhum evento disponível nesta cidade."}
                    </p>
                </div>

                {events.length === 0 ? (
                    <div className="public-card py-16 text-center">
                        <Ticket className="h-12 w-12 text-violet-300 mx-auto mb-4" strokeWidth={1.5} />
                        <p className="text-[14px] font-semibold text-neutral-800 mb-2">
                            Sem eventos disponíveis em {capitalized}
                        </p>
                        <p className="text-[13px] text-neutral-500 mb-6">
                            Volta mais tarde ou explora eventos noutras cidades.
                        </p>
                        <Link
                            href="/events"
                            className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-violet-700"
                        >
                            Ver todos os eventos <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {events.map((event) => {
                            const minPrice = (event as { ticketLots?: { priceCents: number }[] }).ticketLots?.length
                                ? Math.min(...(event as { ticketLots: { priceCents: number }[] }).ticketLots.map((l) => l.priceCents))
                                : null;
                            return (
                                <Link
                                    key={event.id}
                                    href={`/events/${event.slug}`}
                                    className="group public-card overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-violet-200 active:scale-[0.99]"
                                >
                                    <div className="relative aspect-[16/9] overflow-hidden bg-neutral-100">
                                        {event.coverImage ? (
                                            <Image
                                                src={event.coverImage}
                                                alt={event.title}
                                                fill
                                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                                className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 bg-gradient-to-br from-violet-100 to-fuchsia-50" />
                                        )}
                                    </div>

                                    <div className="p-5">
                                        <h2 className="text-[16px] font-semibold text-neutral-900 leading-snug line-clamp-2 mb-3">
                                            {event.title}
                                        </h2>
                                        <div className="space-y-1.5 text-[12px] text-neutral-500">
                                            <div className="flex items-center gap-1.5">
                                                <MapPin className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                                                {event.venue}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                                                {formatDateTimePT(event.startAt)}
                                            </div>
                                        </div>
                                        <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3">
                                            {minPrice != null ? (
                                                <span className="text-[13px] font-semibold text-violet-700">
                                                    Desde {formatPrice(minPrice)}
                                                </span>
                                            ) : (
                                                <span />
                                            )}
                                            <span className="text-[12px] font-medium text-neutral-500 group-hover:text-violet-700 transition">
                                                Ver evento →
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
