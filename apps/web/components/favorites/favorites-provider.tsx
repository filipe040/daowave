"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";

interface FavoritesContextValue {
  favoriteIds: Set<string>;
  isFavorite: (eventId: string) => boolean;
  toggleFavorite: (eventId: string) => Promise<boolean>;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

const EMPTY_IDS: string[] = [];

function setsEqual(a: Set<string>, b: Set<string>) {
  if (a.size !== b.size) return false;
  for (const id of a) {
    if (!b.has(id)) return false;
  }
  return true;
}

export function FavoritesProvider({
  children,
  initialIds = EMPTY_IDS,
}: {
  children: ReactNode;
  initialIds?: string[];
}) {
  const { status } = useSession();
  const initialIdsKey = initialIds.join("\0");
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => new Set(initialIds));
  const [loading, setLoading] = useState(status === "authenticated" && initialIds.length === 0);

  useEffect(() => {
    if (status !== "authenticated") {
      setFavoriteIds((prev) => (prev.size === 0 ? prev : new Set()));
      setLoading((prev) => (prev ? false : prev));
      return;
    }

    if (initialIds.length > 0) {
      const next = new Set(initialIds);
      setFavoriteIds((prev) => (setsEqual(prev, next) ? prev : next));
      setLoading((prev) => (prev ? false : prev));
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch("/api/account/favorites?ids=1")
      .then((r) => (r.ok ? r.json() : { ids: [] }))
      .then((data) => {
        if (cancelled) return;
        const next = new Set<string>(data.ids ?? []);
        setFavoriteIds((prev) => (setsEqual(prev, next) ? prev : next));
      })
      .catch(() => {
        if (cancelled) return;
        setFavoriteIds((prev) => (prev.size === 0 ? prev : new Set()));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [status, initialIdsKey]);

  const toggleFavorite = useCallback(async (eventId: string) => {
    const res = await fetch("/api/account/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId }),
    });

    if (res.status === 401) {
      window.location.href = `/auth/signin?from=${encodeURIComponent(window.location.pathname)}`;
      return false;
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) return false;

    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (data.favorited) next.add(eventId);
      else next.delete(eventId);
      return next;
    });

    return Boolean(data.favorited);
  }, []);

  const value = useMemo(
    () => ({
      favoriteIds,
      isFavorite: (eventId: string) => favoriteIds.has(eventId),
      toggleFavorite,
      loading,
    }),
    [favoriteIds, toggleFavorite, loading]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return ctx;
}
