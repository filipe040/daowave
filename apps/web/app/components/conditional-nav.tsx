"use client";

import { usePathname } from "next/navigation";
import NavClient from "./nav-client";

export default function ConditionalNav() {
  const pathname = usePathname();

  // Hide navbar on auth, admin, and organizer areas (which have their own navigation)
  if (
    pathname?.startsWith("/auth") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/organizer") ||
    pathname?.startsWith("/promotor")
  ) {
    return null;
  }

  return <NavClient />;
}
