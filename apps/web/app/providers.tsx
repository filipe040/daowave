"use client";

import { SessionProvider } from "next-auth/react";
import { FavoritesProvider } from "@/components/favorites/favorites-provider";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
      <FavoritesProvider>{children}</FavoritesProvider>
    </SessionProvider>
  );
}