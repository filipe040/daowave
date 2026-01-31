"use client";

import { usePathname } from "next/navigation";
import PromoterHeader from "./promoter-header";
import PromoterSidebar from "./promoter-sidebar";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const eventIdMatch = pathname.match(/^\/promotor\/events\/([^/]+)/);
  const eventId = eventIdMatch?.[1];

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <PromoterSidebar eventId={eventId} />
      <div className="flex-1 min-w-0 flex flex-col lg:pl-72">
        <PromoterHeader />
        <main className="flex-1 py-4 px-4 sm:px-6 lg:px-8 md:py-8 lg:py-12 pt-14 lg:pt-0">
          {children}
        </main>
      </div>
    </div>
  );
}
