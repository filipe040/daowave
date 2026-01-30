"use client";

import { useState, useEffect } from "react";
import AdminSidebar from "./admin-sidebar";

export default function AdminDashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
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
    <div className="min-h-screen bg-zinc-900 text-white flex">
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between h-14 px-4 border-b border-zinc-800 bg-zinc-950">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
          aria-label="Abrir menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-white">Admin</span>
        <div className="w-10" />
      </div>

      {/* Sidebar: desktop always visible, mobile as drawer */}
      <AdminSidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* Main content */}
      <main
        className={`
          flex-1 min-w-0 w-full
          pt-14 md:pt-0 md:ml-72
          min-h-screen
          py-4 px-4 sm:px-6 lg:px-8 md:py-8 lg:py-12
          overflow-x-auto
        `}
      >
        {children}
      </main>
    </div>
  );
}
