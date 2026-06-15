import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cityMatchValues } from "@/lib/events/public-event-filters";
import { ArrowLeft, Ticket, ArrowRight } from "lucide-react";
import { EventCard } from "@/components/public/event-card";
import { toEventCardData } from "@/components/public/event-mappers";

export const dynamic = "force-dynamic";

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
    const eventCards = events.map(toEventCardData);

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
        <div className="public-shell min-h-screen">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
                <Link
                    href="/events"
                    className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-[#5ec8f8] transition mb-8"
                >
                    <ArrowLeft className="h-4 w-4" /> Todos os eventos
                </Link>

                <div className="mb-8">
                    <p className="text-[11px] uppercase tracking-wider text-zinc-500 mb-1">Por cidade</p>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">
                        Eventos em {capitalized}
                    </h1>
                    <p className="mt-2 text-sm text-zinc-400">
                        {events.length > 0
                            ? `${events.length} evento${events.length !== 1 ? "s" : ""} disponível${events.length !== 1 ? "eis" : ""}`
                            : "Nenhum evento disponível nesta cidade."}
                    </p>
                </div>

                {eventCards.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-[#14141f] py-16 text-center">
                        <Ticket className="h-12 w-12 text-zinc-600 mx-auto mb-4" strokeWidth={1.5} />
                        <p className="text-base font-semibold text-white mb-2">
                            Sem eventos em {capitalized}
                        </p>
                        <p className="text-sm text-zinc-500 mb-6">
                            Explora eventos noutras cidades.
                        </p>
                        <Link
                            href="/events"
                            className="inline-flex items-center gap-2 rounded-full bg-[#00a0e3] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0090cc]"
                        >
                            Ver todos os eventos <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                        {eventCards.map((event) => (
                            <EventCard key={event.id} event={event} variant="compact" />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
