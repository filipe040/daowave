"use client";

import { useState, useEffect } from "react";
import OrganizerSidebar from "./sidebar";
import OrganizerHeader from "./header";

interface OrganizerDashboardShellProps {
  organizerName: string;
  userEmail: string;
  children: React.ReactNode;
}

export default function OrganizerDashboardShell({
  organizerName,
  userEmail,
  children,
}: OrganizerDashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const handler = () => setMobileOpen(false);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [mounted]);

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Sidebar: desktop fixed, mobile drawer */}
      <OrganizerSidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* Main area: margin on desktop so content is next to fixed sidebar */}
      <div className="flex-1 flex flex-col min-w-0 w-full md:ml-64">
        <OrganizerHeader
          organizerName={organizerName}
          userEmail={userEmail}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 min-w-0 overflow-x-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
