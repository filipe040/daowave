import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ArtistCard } from "@/components/events/ArtistCard";
import { Home } from "lucide-react";

export const dynamic = "force-dynamic";

async function getEventWithArtists(slug: string) {
    const event = await prisma.event.findUnique({
        where: { slug },
        select: {
            id: true,
            title: true,
            slug: true,
            venue: true,
            city: true,
            status: true,
            archivedAt: true,
            layoutMode: true,
            artists: {
                where: { isPublished: true },
                orderBy: [{ sortOrder: "asc" }, { performanceAt: "asc" }],
                include: {
                    ticketType: {
                        include: {
                            ticketLots: {
                                where: { status: "ACTIVE" },
                                orderBy: { priceCents: "asc" },
                                take: 1,
                            },
                        },
                    },
                },
            },
        },
    });
    return event;
}

export default async function EventArtistsPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const event = await getEventWithArtists(slug);

    if (!event || event.status !== "PUBLISHED" || event.archivedAt) {
        notFound();
    }

    if (event.layoutMode !== "ARTISTS" && event.artists.length === 0) {
        redirect(`/events/${slug}`);
    }

    const artists = await Promise.all(
        event.artists.map(async (artist) => {
            const lot = artist.ticketType.ticketLots[0];
            let available = 0;
            if (lot) {
                const holds = await prisma.inventoryHold.aggregate({
                    where: {
                        ticketLotId: lot.id,
                        status: "ACTIVE",
                        expiresAt: { gt: new Date() },
                    },
                    _sum: { qty: true },
                });
                const capacity = lot.capacity > 0 ? lot.capacity : lot.quantityTotal;
                available = Math.max(0, capacity - lot.soldCount - (holds._sum.qty || 0));
            }
            return {
                id: artist.id,
                name: artist.name,
                slug: artist.slug,
                imageUrl: artist.imageUrl,
                performanceAt: artist.performanceAt,
                venue: artist.venue,
                eventVenue: event.venue,
                eventCity: event.city,
                badgeLabel: artist.badgeLabel,
                minPriceCents: lot?.priceCents ?? null,
                soldOut: available <= 0,
            };
        })
    );

    return (
        <div className="min-h-screen bg-[#f5f5f7] text-neutral-900">
            {/* Header estilo referência */}
            <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-black/[0.06]">
                <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-100 text-[13px] font-semibold text-neutral-700 hover:bg-neutral-200 transition-colors"
                    >
                        <Home className="h-4 w-4" />
                        Início
                    </Link>
                    <div className="text-[13px] font-bold text-neutral-500 uppercase tracking-widest hidden sm:block">
                        {event.title}
                    </div>
                    <div className="w-24" />
                </div>
            </header>

            <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
                <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900">
                        {event.title}
                    </h1>
                    <p className="text-neutral-500 mt-1 text-[15px]">
                        {event.venue} · {event.city}
                    </p>
                </div>

                {artists.length === 0 ? (
                    <div className="rounded-2xl bg-white p-12 text-center ring-1 ring-black/[0.06]">
                        <p className="text-neutral-500">Ainda não há artistas disponíveis.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {artists.map((artist) => (
                            <ArtistCard key={artist.id} artist={artist} eventSlug={event.slug} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
