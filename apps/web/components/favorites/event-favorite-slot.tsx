"use client";

import { FavoriteButton } from "./favorite-button";

export function EventFavoriteSlot({ eventId }: { eventId: string }) {
  return (
    <FavoriteButton
      eventId={eventId}
      size="sm"
      className="absolute top-3 left-3 z-10 shadow-sm"
    />
  );
}
