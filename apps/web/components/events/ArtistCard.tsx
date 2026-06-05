import Link from "next/link";
import Image from "next/image";
import { formatCurrency, formatPerformanceDateTime, formatShortDayMonth } from "@/lib/utils";

export interface ArtistCardData {
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
    performanceAt: string | Date;
    venue: string | null;
    eventVenue: string;
    eventCity: string;
    badgeLabel?: string | null;
    minPriceCents?: number | null;
    soldOut?: boolean;
}

export function ArtistCard({
    artist,
    eventSlug,
}: {
    artist: ArtistCardData;
    eventSlug: string;
}) {
    const location = artist.venue || artist.eventVenue;
    const href = `/events/${eventSlug}/artistas/${artist.slug}`;

    return (
        <Link href={href} className="group block">
            <article className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.06] transition-all hover:shadow-md hover:-translate-y-0.5">
                <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
                    {artist.imageUrl ? (
                        <Image
                            src={artist.imageUrl}
                            alt={artist.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                            sizes="(max-width: 768px) 100vw, 33vw"
                            unoptimized={artist.imageUrl.startsWith("http")}
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-200 via-fuchsia-100 to-orange-100" />
                    )}

                    {/* Overlay ondulado estilo referência */}
                    <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
                    <div
                        className="absolute inset-x-0 bottom-0 h-24 opacity-90"
                        style={{
                            background:
                                "linear-gradient(135deg, rgba(124,58,237,0.85) 0%, rgba(59,130,246,0.7) 40%, rgba(249,115,22,0.75) 100%)",
                            clipPath: "ellipse(120% 100% at 50% 100%)",
                        }}
                    />

                    {artist.badgeLabel && (
                        <div className="absolute top-0 right-0 w-28 h-28 overflow-hidden pointer-events-none">
                            <span className="absolute top-4 -right-8 rotate-45 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider py-1 px-10 shadow-lg">
                                {artist.badgeLabel}
                            </span>
                        </div>
                    )}

                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white z-10">
                        <p className="text-[13px] font-medium opacity-90 mb-1">
                            {formatShortDayMonth(artist.performanceAt)}
                        </p>
                        <h3 className="text-xl sm:text-2xl font-black leading-tight tracking-tight drop-shadow-sm">
                            {artist.name}
                        </h3>
                    </div>
                </div>

                <div className="p-4 space-y-1">
                    <p className="font-bold text-neutral-900 text-[15px] tracking-tight">{artist.name}</p>
                    <p className="text-[13px] text-neutral-500 truncate">{location}</p>
                    <p className="text-[13px] text-neutral-400">
                        {formatPerformanceDateTime(artist.performanceAt)}
                    </p>
                    {artist.minPriceCents != null && (
                        <p className="text-[13px] font-semibold text-neutral-700 pt-1">
                            {artist.soldOut ? (
                                <span className="text-red-500">Esgotado</span>
                            ) : (
                                <>desde {formatCurrency(artist.minPriceCents)}</>
                            )}
                        </p>
                    )}
                </div>
            </article>
        </Link>
    );
}
