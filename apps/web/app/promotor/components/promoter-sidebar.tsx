"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

interface PromoterSidebarProps {
  eventId?: string;
  currentSection?: string;
}

export default function PromoterSidebar({ eventId, currentSection }: PromoterSidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { data: session } = useSession();

  // Determine current section from pathname
  const getCurrentSection = () => {
    if (pathname?.includes("/tickets")) return "BILHÉTICA & RECEITA";
    if (pathname?.includes("/checkin")) return "CONTROLO DE ACESSO";
    return "DASHBOARD";
  };

  const section = currentSection || getCurrentSection();

  // Close sidebar on mobile when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const sidebar = document.getElementById('promoter-sidebar');
      const button = document.getElementById('mobile-menu-button');
      if (isMobileOpen && sidebar && !sidebar.contains(e.target as Node) && !button?.contains(e.target as Node)) {
        setIsMobileOpen(false);
      }
    };

    if (isMobileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileOpen]);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        id="mobile-menu-button"
        className="lg:hidden fixed top-4 left-4 z-50 w-9 h-9 bg-zinc-900 border border-white/10 rounded-lg flex items-center justify-center text-white"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        id="promoter-sidebar"
        className={`w-56 lg:w-64 border-r border-white/10 bg-black/50 flex flex-col fixed left-0 top-0 h-screen z-40 transition-transform duration-300 lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="p-4 lg:p-5 border-b border-white/10">
          <div className="flex items-center gap-2 lg:gap-3">
            <div className="w-6 h-6 lg:w-7 lg:h-7 border-2 border-white flex items-center justify-center flex-shrink-0">
              <div className="grid grid-cols-2 gap-0.5 p-0.5">
                <div className="w-1 h-1 bg-white"></div>
                <div className="w-1 h-1 bg-white"></div>
                <div className="w-1 h-1 bg-white"></div>
                <div className="w-1 h-1 bg-white"></div>
              </div>
            </div>
            <h2 className="text-base lg:text-lg font-bold text-white uppercase">5IVE TICKETS</h2>
          </div>
        </div>

        {/* Breadcrumb Section */}
        {eventId && (
          <div className="p-4 lg:p-5 border-b border-white/10">
            <div className="w-6 h-6 lg:w-7 lg:h-7 border-2 border-green-500 flex items-center justify-center mb-3 hover:border-green-400 transition-colors cursor-pointer group">
              <span className="text-white font-bold text-sm lg:text-base group-hover:scale-110 transition-transform">Σ</span>
            </div>
            {section !== "DASHBOARD" && (
              <div className="text-xs lg:text-sm text-white">
                <Link
                  href={`/promotor/events/${eventId}`}
                  className="text-white/50 hover:text-white transition-colors"
                >
                  DASHBOARD
                </Link>
                <span className="text-white/30 mx-1.5">/</span>
                <span className="text-green-400">{section}</span>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-4 lg:space-y-5">
        {/* GESTÃO */}
        <div>
          <div className="px-3 py-1.5 text-[10px] lg:text-xs text-white/50 uppercase tracking-wider mb-1.5">
            GESTÃO
          </div>
          <div className="space-y-0.5">
            {eventId ? (
              <Link
                href={`/promotor/events/${eventId}`}
                className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 group ${
                  pathname === `/promotor/events/${eventId}`
                    ? "bg-white text-black shadow-lg scale-105"
                    : "text-white/70 hover:text-white hover:bg-white/5 hover:scale-105"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-4 h-4 border flex items-center justify-center flex-shrink-0 transition-all ${
                    pathname === `/promotor/events/${eventId}` ? "border-black group-hover:scale-110" : "border-white/30 group-hover:border-white"
                  }`}>
                    <div className="grid grid-cols-2 gap-0.5 p-0.5">
                      <div className={`w-0.5 h-0.5 transition-all ${pathname === `/promotor/events/${eventId}` ? "bg-black" : "bg-white group-hover:scale-125"}`}></div>
                      <div className={`w-0.5 h-0.5 transition-all ${pathname === `/promotor/events/${eventId}` ? "bg-black" : "bg-white group-hover:scale-125"}`}></div>
                      <div className={`w-0.5 h-0.5 transition-all ${pathname === `/promotor/events/${eventId}` ? "bg-black" : "bg-white group-hover:scale-125"}`}></div>
                      <div className={`w-0.5 h-0.5 transition-all ${pathname === `/promotor/events/${eventId}` ? "bg-black" : "bg-white group-hover:scale-125"}`}></div>
                    </div>
                  </div>
                  <span className="text-xs lg:text-sm">Dashboard</span>
                </div>
              </Link>
            ) : (
              <Link
                href="/promotor"
                className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 group ${
                  pathname === "/promotor"
                    ? "bg-white text-black shadow-lg scale-105"
                    : "text-white/70 hover:text-white hover:bg-white/5 hover:scale-105"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-4 h-4 border flex items-center justify-center flex-shrink-0 transition-all ${
                    pathname === "/promotor" ? "border-black group-hover:scale-110" : "border-white/30 group-hover:border-white"
                  }`}>
                    <div className="grid grid-cols-2 gap-0.5 p-0.5">
                      <div className={`w-0.5 h-0.5 transition-all ${pathname === "/promotor" ? "bg-black" : "bg-white group-hover:scale-125"}`}></div>
                      <div className={`w-0.5 h-0.5 transition-all ${pathname === "/promotor" ? "bg-black" : "bg-white group-hover:scale-125"}`}></div>
                      <div className={`w-0.5 h-0.5 transition-all ${pathname === "/promotor" ? "bg-black" : "bg-white group-hover:scale-125"}`}></div>
                      <div className={`w-0.5 h-0.5 transition-all ${pathname === "/promotor" ? "bg-black" : "bg-white group-hover:scale-125"}`}></div>
                    </div>
                  </div>
                  <span className="text-xs lg:text-sm">Dashboard</span>
                </div>
              </Link>
            )}
            {eventId && (
              <>
                <Link
                  href={`/promotor/events/${eventId}/tickets`}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs lg:text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200 group hover:scale-105"
                >
                  <svg className="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                  <span className="group-hover:translate-x-0.5 transition-transform">Bilhética</span>
                </Link>
                <Link
                  href={`/promotor/checkin/${eventId}`}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs lg:text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200 group hover:scale-105"
                >
                  <svg className="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="group-hover:translate-x-0.5 transition-transform">Acesso</span>
                </Link>
              </>
            )}
            <div className="flex items-center gap-2.5 px-3 py-2 text-xs lg:text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200 cursor-pointer group hover:scale-105">
              <svg className="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="group-hover:translate-x-0.5 transition-transform">POS</span>
            </div>
            {eventId && (
              <Link
                href={`/promotor/events/${eventId}/carteiras`}
                className="flex items-center gap-2.5 px-3 py-2 text-xs lg:text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200 group hover:scale-105"
              >
                <svg className="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span className="group-hover:translate-x-0.5 transition-transform">Carteiras</span>
              </Link>
            )}
          </div>
        </div>

        {/* ORGANIZAÇÃO */}
        <div>
          <div className="px-3 py-1.5 text-[10px] lg:text-xs text-white/50 uppercase tracking-wider mb-1.5">
            ORGANIZAÇÃO
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2.5 px-3 py-2 text-xs lg:text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Equipas</span>
            </div>
            <div className="flex items-center gap-2.5 px-3 py-2 text-xs lg:text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              <span>Branding</span>
            </div>
          </div>
        </div>

        {/* CONFIGURAÇÃO */}
        <div>
          <div className="px-3 py-1.5 text-[10px] lg:text-xs text-white/50 uppercase tracking-wider mb-1.5">
            CONFIGURAÇÃO
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs lg:text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
                <span>Integrações</span>
              </div>
              <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs lg:text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span>Notificações</span>
              </div>
              <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <div className="flex items-center gap-2.5 px-3 py-2 text-xs lg:text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Definições</span>
            </div>
          </div>
        </div>

        {/* ANÁLISE */}
        <div>
          <div className="px-3 py-1.5 text-[10px] lg:text-xs text-white/50 uppercase tracking-wider mb-1.5">
            ANÁLISE
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs lg:text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Relatórios</span>
              </div>
              <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs lg:text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
                <span>Auditoria</span>
              </div>
              <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* SISTEMA */}
        <div>
          <div className="px-3 py-1.5 text-[10px] lg:text-xs text-white/50 uppercase tracking-wider mb-1.5">
            SISTEMA
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs lg:text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Manutenção</span>
              </div>
              <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <div className="flex items-center gap-2.5 px-3 py-2 text-xs lg:text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Jobs</span>
            </div>
            <div className="flex items-center gap-2.5 px-3 py-2 text-xs lg:text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span>Tenants</span>
            </div>
          </div>
        </div>
      </nav>

      {/* User Account Section */}
      {session?.user && (
        <div className="border-t border-white/10 p-4 mt-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full border-2 border-white/20 flex items-center justify-center flex-shrink-0 bg-white/5">
              <svg className="w-6 h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white truncate">
                {session.user.name || "Promotor"}
              </div>
              <div className="text-xs text-white/70 truncate">
                {session.user.email}
              </div>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/promotor/login" })}
            className="w-full bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded-lg px-4 py-2.5 flex items-center justify-center gap-2 text-sm text-white/70 hover:text-white transition-all duration-200 group"
          >
            <svg className="w-4 h-4 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sair</span>
          </button>
        </div>
      )}
    </aside>
    </>
  );
}
