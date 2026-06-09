"use client";

import { FavoriteButton } from "@/components/favorites/favorite-button";

export function EventDetailFavorite({ eventId }: { eventId: string }) {
  return <FavoriteButton eventId={eventId} label size="md" />;
}
