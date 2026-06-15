"use client";

import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Calendar, Heart, MapPin, ArrowRight } from "lucide-react";
import { EventFavoriteSlot } from "@/components/favorites/event-favorite-slot";

interface FavoriteEvent {
  id: string;
  title: string;
  slug: string;
  city: string;
  venue: string;
  category: string | null;
  startAt: string | Date;
  bannerUrl: string | null;
  coverImage: string | null;
  ticketLots: { priceCents: number }[];
}

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("pt-PT", { style: "currency", currency: "EUR" });
}

export default function AccountFavorites({
  initialEvents,
}: {
  initialEvents: FavoriteEvent[];
}) {
  if (initialEvents.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-[#14141f] p-10 sm:p-14 text-center">
        <Heart className="h-14 w-14 text-neutral-300 mx-auto mb-4" strokeWidth={1.5} />
        <h1 className="text-xl font-bold text-white">Sem favoritos</h1>
        <p className="mt-2 text-sm text-zinc-500 max-w-md mx-auto">
          Guarda eventos que te interessam clicando no coração nas páginas de eventos.
        </p>
        <Link
          href="/events"
          className="inline-flex mt-6 items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00a0e3] text-white text-sm font-bold hover:bg-[#0090cc]"
        >
          Explorar eventos
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Favoritos</h1>
        <p className="text-sm text-zinc-500 mt-1">
          {initialEvents.length} evento{initialEvents.length !== 1 ? "s" : ""} guardado
          {initialEvents.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {initialEvents.map((event) => {
          const minPrice = event.ticketLots.length
            ? Math.min(...event.ticketLots.map((l) => l.priceCents))
            : null;

          return (
            <div
              key={event.id}
              className="relative group overflow-hidden rounded-3xl border border-white/10 bg-[#14141f] shadow-md hover:shadow-lg transition-all"
            >
              <EventFavoriteSlot eventId={event.id} />
              <Link href={`/events/${event.slug}`} className="block">
                {(event.bannerUrl || event.coverImage) && (
                  <div className="relative aspect-[16/9] overflow-hidden bg-neutral-100">
                    <Image
                      src={event.bannerUrl || event.coverImage!}
                      alt={event.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-cover transition-transform group-hover:scale-[1.03]"
                      unoptimized
                    />
                  </div>
                )}
                <div className="p-5">
                  <h2 className="text-lg font-bold text-white line-clamp-2 pr-10">{event.title}</h2>
                  <div className="mt-3 space-y-2 text-sm text-zinc-400">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[#00a0e3] shrink-0" />
                      <span className="truncate">{event.venue}, {event.city}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[#00a0e3] shrink-0" />
                      <span>
                        {format(new Date(event.startAt), "dd MMM yyyy, HH:mm", { locale: pt })}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                    {minPrice != null ? (
                      <span className="text-sm font-bold text-[#5ec8f8]">Desde {formatPrice(minPrice)}</span>
                    ) : (
                      <span className="text-sm text-zinc-500">Consultar preço</span>
                    )}
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-[#00a0e3]">
                      Ver evento <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
