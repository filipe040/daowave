"use client";

import { Heart } from "lucide-react";
import { useFavorites } from "./favorites-provider";
import { useState } from "react";

interface FavoriteButtonProps {
  eventId: string;
  className?: string;
  size?: "sm" | "md";
  label?: boolean;
}

export function FavoriteButton({
  eventId,
  className = "",
  size = "md",
  label = false,
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite, loading } = useFavorites();
  const [busy, setBusy] = useState(false);
  const favorited = isFavorite(eventId);

  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const btnSize = size === "sm" ? "h-9 w-9" : "h-10 w-10";

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy || loading) return;
    setBusy(true);
    await toggleFavorite(eventId);
    setBusy(false);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy || loading}
      aria-label={favorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      aria-pressed={favorited}
      className={`inline-flex items-center justify-center gap-2 rounded-full border backdrop-blur-sm transition-all disabled:opacity-50 ${btnSize} ${
        favorited
          ? "bg-red-500 border-red-500 text-white shadow-md shadow-red-500/30 hover:bg-red-600"
          : "bg-white/90 border-neutral-200/80 text-neutral-500 hover:text-red-500 hover:border-red-200 hover:bg-white"
      } ${label ? "w-auto px-4" : ""} ${className}`}
    >
      <Heart className={`${iconSize} ${favorited ? "fill-current" : ""}`} />
      {label && (
        <span className="text-xs font-bold pr-1">
          {favorited ? "Guardado" : "Guardar"}
        </span>
      )}
    </button>
  );
}
