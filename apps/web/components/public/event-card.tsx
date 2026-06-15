import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, ArrowUpRight } from "lucide-react";
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
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#14141f] transition-all duration-300 hover:border-[#00a0e3]/40 hover:shadow-[0_8px_40px_rgba(0,160,227,0.12)] ${
        isFeatured ? "min-w-[280px] sm:min-w-[320px] max-w-[360px] snap-start" : ""
      }`}
    >
      <EventFavoriteSlot eventId={event.id} />
      <Link href={`/events/${event.slug}`} className="flex flex-col h-full">
        <div
          className={`relative overflow-hidden bg-[#1a1a28] ${
            isFeatured ? "aspect-[3/4]" : isCompact ? "aspect-[16/10]" : "aspect-[4/5] sm:aspect-[3/4]"
          }`}
        >
          {image ? (
            <Image
              src={image}
              alt={event.title}
              fill
              sizes={isFeatured ? "320px" : "(max-width: 640px) 100vw, 33vw"}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a5f] to-[#0c0c12] flex items-center justify-center">
              <span className="text-4xl font-black text-white/20">LP</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c12] via-[#0c0c12]/40 to-transparent" />
          {event.minPriceCents != null && (
            <div className="absolute bottom-3 left-3 rounded-lg bg-black/60 backdrop-blur-sm px-2.5 py-1 text-xs font-bold text-white border border-white/10">
              Desde {formatPrice(event.minPriceCents)}
            </div>
          )}
          <div className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-white/10">
            <ArrowUpRight className="h-4 w-4 text-white" />
          </div>
        </div>

        <div className={`flex flex-col flex-1 ${isCompact ? "p-3" : "p-4"}`}>
          <h3
            className={`font-bold text-white leading-snug line-clamp-2 group-hover:text-[#5ec8f8] transition-colors ${
              isCompact ? "text-sm" : "text-[15px] sm:text-base"
            }`}
          >
            {event.title}
          </h3>
          <div className={`mt-2.5 space-y-1.5 text-zinc-400 ${isCompact ? "text-xs" : "text-[13px]"}`}>
            <p className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-[#00a0e3]" />
              <span className="capitalize">{formatDatePT(event.startAt)}</span>
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[#00a0e3]" />
              <span className="line-clamp-1">
                {event.venue}, {event.city}
              </span>
            </p>
          </div>
        </div>
      </Link>
    </article>
  );
}
