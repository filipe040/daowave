import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin } from "lucide-react";
import { EventFavoriteSlot } from "@/components/favorites/event-favorite-slot";

export type PublicEventCardData = {
  id: string;
  slug: string;
  title: string;
  city: string;
  venue: string;
  startAt: Date | string;
  bannerUrl?: string | null;
  coverImage?: string | null;
  minPriceCents?: number | null;
};

function formatDatePT(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-PT", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("pt-PT", { style: "currency", currency: "EUR" });
}

type Variant = "default" | "featured" | "compact";

export function EventCard({
  event,
  variant = "default",
}: {
  event: PublicEventCardData;
  variant?: Variant;
}) {
  const image = event.bannerUrl || event.coverImage;
  const isFeatured = variant === "featured";
  const isCompact = variant === "compact";

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-2xl bg-[#111118] transition-all duration-300 card-shimmer glow-hover border border-white/[0.07] ${
        isFeatured
          ? "min-w-[72vw] sm:min-w-[280px] md:min-w-[300px] max-w-[340px] snap-start shrink-0"
          : ""
      }`}
    >
      <EventFavoriteSlot eventId={event.id} />
      <Link href={`/events/${event.slug}`} className="flex flex-col h-full">
        {/* Image container */}
        <div
          className={`relative overflow-hidden bg-[#1a1a28] ${
            isFeatured
              ? "aspect-[2/3]"
              : isCompact
              ? "aspect-[3/2]"
              : "aspect-[2/3] sm:aspect-[2/3]"
          }`}
        >
          {image ? (
            <Image
              src={image}
              alt={event.title}
              fill
              sizes={isFeatured ? "300px" : "(max-width: 640px) 50vw, 25vw"}
              className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a5f] via-[#0d1f3c] to-[#0c0c12] flex items-center justify-center">
              <span className="text-5xl font-black text-white/10 tracking-tighter">LP</span>
            </div>
          )}

          {/* Gradient overlay – stronger at bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#111118] via-[#111118]/30 to-transparent" />

          {/* Price badge */}
          {event.minPriceCents != null && (
            <div className="absolute bottom-3 left-3 z-10 rounded-lg bg-[#00a0e3] px-2.5 py-1 text-xs font-black text-white shadow-lg shadow-[#00a0e3]/30">
              {formatPrice(event.minPriceCents)}
            </div>
          )}
        </div>

        {/* Info */}
        <div className={`flex flex-col flex-1 ${isCompact ? "p-3" : "p-4"}`}>
          <h3
            className={`font-bold text-white leading-snug line-clamp-2 group-hover:text-[#5ec8f8] transition-colors duration-200 ${
              isCompact ? "text-sm" : "text-[15px] sm:text-base"
            }`}
          >
            {event.title}
          </h3>
          <div className={`mt-2.5 space-y-1 text-zinc-500 ${isCompact ? "text-xs" : "text-[12px]"}`}>
            <p className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3 shrink-0 text-[#00a0e3]" />
              <span className="capitalize text-zinc-400">{formatDatePT(event.startAt)}</span>
            </p>
            <p className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 shrink-0 text-[#00a0e3]" />
              <span className="line-clamp-1 text-zinc-400">
                {event.venue}, {event.city}
              </span>
            </p>
          </div>
        </div>
      </Link>
    </article>
  );
}
