"use client";

import { usePathname } from "next/navigation";
import Footer from "./footer";

export default function ConditionalFooter() {
  const pathname = usePathname();
  
  // Hide footer on auth pages, admin panel, promoter login, and promoter dashboard
  if (
    pathname?.startsWith("/auth") ||
    pathname?.startsWith("/admin") ||
    pathname === "/promotor/login" ||
    pathname?.startsWith("/promotor")
  ) {
    return null;
  }
  
  return <Footer />;
}
