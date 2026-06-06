import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { EventArtistService } from "@/lib/services/event-artist.service";
import { resolveEventLocation } from "@/lib/maps";
import { formatPerformanceDateTime, daysUntil } from "@/lib/utils";
import { Calendar, Home, MapPin } from "lucide-react";
import { ArtistTicketSelector } from "./artist-ticket-selector";

export const dynamic = "force-dynamic";

export default async function ArtistDetailPage({
    params,
}: {
    params: Promise<{ slug: string; artistSlug: string }>;
}) {
    const { slug, artistSlug } = await params;

    const event = await prisma.event.findUnique({
        where: { slug, status: "PUBLISHED" },
        select: {
            id: true,
            title: true,
            slug: true,
            venue: true,
            city: true,
            archivedAt: true,
            locationUrl: true,
        },
    });

    if (!event || event.archivedAt) notFound();

    const artist = await EventArtistService.getBySlug(event.id, artistSlug);
    if (!artist || !artist.isPublished) notFound();

    const { venueDisplay, mapEmbedUrl } = resolveEventLocation(event, artist);
    const days = daysUntil(artist.performanceAt);

    return (
        <div className="min-h-screen bg-[#f5f5f7] text-neutral-900">
            <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-black/[0.06]">
                <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
                    <Link
                        href={`/events/${slug}/artistas`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-100 text-[13px] font-semibold text-neutral-700 hover:bg-neutral-200 transition-colors"
                    >
                        <Home className="h-4 w-4" />
                        Início
                    </Link>
                    <span className="text-[13px] font-bold text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full">
                        0.00€
                    </span>
                </div>
            </header>

            <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
                    {/* Coluna esquerda — poster + meta */}
                    <div className="space-y-6">
                        <div className="relative aspect-[3/4] max-w-md mx-auto lg:mx-0 overflow-hidden rounded-2xl bg-neutral-200 shadow-lg ring-1 ring-black/[0.06]">
                            {artist.imageUrl ? (
                                <Image
                                    src={artist.imageUrl}
                                    alt={artist.name}
                                    fill
                                    className="object-cover"
                                    priority
                                    sizes="(max-width: 1024px) 100vw, 400px"
                                    unoptimized={artist.imageUrl.startsWith("http")}
                                />
                            ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-violet-300 via-blue-200 to-orange-200" />
                            )}
                            {artist.badgeLabel && (
                                <span className="absolute top-4 left-4 bg-white/95 text-red-600 text-[11px] font-bold uppercase px-3 py-1 rounded-full shadow">
                                    {artist.badgeLabel}
                                </span>
                            )}
                        </div>

                        <div className="space-y-4 max-w-md mx-auto lg:mx-0">
                            <div className="flex items-start gap-3">
                                <Calendar className="h-5 w-5 text-neutral-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-semibold text-neutral-900">
                                        {formatPerformanceDateTime(artist.performanceAt)}
                                    </p>
                                    {days > 0 && (
                                        <p className="text-[13px] text-neutral-500 mt-0.5">
                                            Começa em {days} {days === 1 ? "dia" : "dias"}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-neutral-400 mt-0.5 shrink-0" />
                                <p className="font-semibold text-neutral-900">{venueDisplay}</p>
                            </div>
                        </div>
                    </div>

                    {/* Coluna direita — bilhetes + mapa */}
                    <div className="space-y-8">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-900 mb-2">
                                {artist.name}
                            </h1>
                            {artist.bio && (
                                <p className="text-neutral-600 text-[15px] leading-relaxed">{artist.bio}</p>
                            )}
                        </div>

                        <ArtistTicketSelector
                            event={{ id: event.id, title: event.title, slug: event.slug }}
                            filterTypeId={artist.ticketTypeId}
                        />

                        <section>
                            <h2 className="text-lg font-bold text-neutral-900 mb-2">Localização</h2>
                            <p className="text-neutral-600 mb-4">{venueDisplay}</p>
                            <div className="rounded-2xl overflow-hidden ring-1 ring-black/[0.08] h-64 bg-neutral-200">
                                <iframe
                                    title="Mapa"
                                    className="w-full h-full border-0"
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    src={mapEmbedUrl}
                                />
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
