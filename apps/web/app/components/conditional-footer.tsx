"use client";

import { usePathname } from "next/navigation";
import Footer from "./footer";

export default function ConditionalFooter() {
  const pathname = usePathname();

  // Hide footer on auth pages, admin panel, promoter login, promoter dashboard, and account area
  if (
    pathname?.startsWith("/auth") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/organizer") ||
    pathname?.startsWith("/promotor") ||
    pathname?.startsWith("/account")
  ) {
    return null;
  }

  return <Footer />;
}
