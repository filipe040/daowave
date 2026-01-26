"use client";

import { usePathname } from "next/navigation";
import NavClient from "./nav-client";

export default function ConditionalNav() {
  const pathname = usePathname();
  
  // Hide navbar on auth pages, promoter login, and promoter dashboard
  if (pathname?.startsWith("/auth") || pathname === "/promotor/login" || pathname?.startsWith("/promotor")) {
    return null;
  }
  
  return <NavClient />;
}
