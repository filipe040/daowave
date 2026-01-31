"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PromoterSidebar from "../../../../components/promoter-sidebar";
import Breadcrumbs from "@/app/components/breadcrumbs";

function ArchiveButton({ eventId, eventStatus, archivedAt }: { eventId: string; eventStatus: string; archivedAt: Date | string | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isArchived = archivedAt !== null;
  const canArchive = eventStatus === "PUBLISHED";

  const handleArchive = async () => {
    if (!canArchive && !isArchived) {
      alert("Apenas eventos publicados podem ser arquivados");
      return;
    }

    if (!confirm(isArchived ? "Tem a certeza que deseja re-publicar este evento?" : "Tem a certeza que deseja arquivar este evento?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/promotor/events/${eventId}/archive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archive: !isArchived }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao arquivar evento");
      }

      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao arquivar evento");
    } finally {
      setLoading(false);
    }
  };

  if (!canArchive && !isArchived) {
    return null; // Don't show button if event is not published and not archived
  }

  return (
    <button
      onClick={handleArchive}
      disabled={loading}
      className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs uppercase font-semibold whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        isArchived
          ? "bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500/30"
          : "bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30"
      }`}
    >
      {loading ? "..." : isArchived ? "RE-PUBLICAR" : "ARQUIVAR"}
    </button>
  );
}

interface Event {
  id: string;
  title: string;
  slug: string;
  status: string;
  startAt: Date | string;
  endAt: Date | string;
  city: string;
  venue: string;
  archivedAt?: Date | string | null;
  _count: {
    tickets: number;
    orders: number;
  };
}

interface Stats {
  totalTickets: number;
  checkedInTickets: number;
  totalSales: number;
  totalOrders: number;
}

interface EventDashboardContentProps {
  event: Event;
  stats: Stats;
}

export default function EventDashboardContent({ event, stats }: EventDashboardContentProps) {
  const [systemStatus, setSystemStatus] = useState<"ATIVO" | "INATIVO">("ATIVO");

  const eventDate = new Date(event.startAt);
  
  // Format date manually
  const months = [
    "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO",
    "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"
  ];
  const day = eventDate.getDate();
  const month = months[eventDate.getMonth()];
  const year = eventDate.getFullYear();
  const formattedDate = `${day} DE ${month} DE ${year}`;
  
  const hours = eventDate.getHours().toString().padStart(2, '0');
  const minutes = eventDate.getMinutes().toString().padStart(2, '0');
  const formattedTime = `${hours}:${minutes}`;
  
  const shortDate = `${day.toString().padStart(2, '0')}/${(eventDate.getMonth() + 1).toString().padStart(2, '0')}/${year}`;

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Fixed Sidebar */}
      <PromoterSidebar eventId={event.id} />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto lg:ml-72 pt-12 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
          {/* Breadcrumbs */}
          <Breadcrumbs
            items={[
              { label: "ESTÚDIO", href: `/promotor/events/${event.id}` },
              { label: "DASHBOARD", active: true },
            ]}
          />

          {/* Event Header Card */}
          <div className="bg-zinc-900 border border-white/10 rounded-lg p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-white/30 flex items-center justify-center rounded-lg flex-shrink-0">
                  <div className="grid grid-cols-2 gap-0.5 p-1.5">
                    <div className="w-1.5 h-1.5 bg-white"></div>
                    <div className="w-1.5 h-1.5 bg-white"></div>
                    <div className="w-1.5 h-1.5 bg-white"></div>
                    <div className="w-1.5 h-1.5 bg-white"></div>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white uppercase mb-1.5 sm:mb-2 truncate">
                    {event.title}
                  </h1>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></div>
                    <span className="text-xs sm:text-sm text-green-400 uppercase font-semibold">
                      {event.status === "PUBLISHED" ? "PUBLICADO" : "RASCUNHO"}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm text-white/70 uppercase">
                    {formattedDate} {formattedTime}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 sm:gap-3 flex-shrink-0">
                <Link
                  href={`/promotor/events/${event.id}/settings`}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 border border-white/20 rounded-lg text-white hover:border-white/40 transition-colors text-xs uppercase font-semibold whitespace-nowrap"
                >
                  DEFINIÇÕES
                </Link>
                <ArchiveButton eventId={event.id} eventStatus={event.status} archivedAt={null} />
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-zinc-900 border border-white/10 rounded-lg p-3 sm:p-4 hover:border-white/20 hover:bg-zinc-800 transition-all duration-200 group hover:scale-105 cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white/50 flex-shrink-0 group-hover:text-white group-hover:scale-110 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-[10px] sm:text-xs text-white/50 uppercase group-hover:text-white/70 transition-colors">Data</span>
              </div>
              <div className="text-base sm:text-lg lg:text-xl font-bold text-white group-hover:text-green-400 transition-colors">{shortDate}</div>
            </div>
            <div className="bg-zinc-900 border border-white/10 rounded-lg p-3 sm:p-4 hover:border-white/20 hover:bg-zinc-800 transition-all duration-200 group hover:scale-105 cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white/50 flex-shrink-0 group-hover:text-white group-hover:scale-110 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span className="text-[10px] sm:text-xs text-white/50 uppercase group-hover:text-white/70 transition-colors">Participantes</span>
              </div>
              <div className="text-base sm:text-lg lg:text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{stats.totalTickets}</div>
            </div>
            <div className="bg-zinc-900 border border-white/10 rounded-lg p-3 sm:p-4 hover:border-white/20 hover:bg-zinc-800 transition-all duration-200 group hover:scale-105 cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white/50 flex-shrink-0 group-hover:text-white group-hover:scale-110 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-[10px] sm:text-xs text-white/50 uppercase group-hover:text-white/70 transition-colors">Hora</span>
              </div>
              <div className="text-base sm:text-lg lg:text-xl font-bold text-white group-hover:text-purple-400 transition-colors">{formattedTime}</div>
            </div>
          </div>

          {/* Management Terminal */}
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white uppercase mb-3 sm:mb-4">
              TERMINAL DE GESTÃO
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <Link
                href={`/promotor/events/${event.id}/tickets`}
                className="bg-zinc-900 border border-white/10 rounded-lg p-4 sm:p-5 hover:border-white/20 hover:bg-zinc-800 transition-all duration-200 group hover:scale-105 hover:shadow-lg"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 border border-white/20 rounded-lg flex items-center justify-center group-hover:border-white/40 group-hover:scale-110 group-hover:bg-white/5 transition-all duration-200 flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white uppercase group-hover:text-green-400 transition-colors">BILHÉTICA</h3>
                </div>
              </Link>
              <Link
                href={`/promotor/checkin/${event.id}`}
                className="bg-zinc-900 border border-white/10 rounded-lg p-4 sm:p-5 hover:border-white/20 hover:bg-zinc-800 transition-all duration-200 group hover:scale-105 hover:shadow-lg"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 border border-white/20 rounded-lg flex items-center justify-center group-hover:border-white/40 group-hover:scale-110 group-hover:bg-white/5 transition-all duration-200 flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white uppercase group-hover:text-green-400 transition-colors">CONTROLO DE ACESSO</h3>
                </div>
              </Link>
              <Link
                href={`/promotor/events/${event.id}/teams`}
                className="bg-zinc-900 border border-white/10 rounded-lg p-4 sm:p-5 hover:border-white/20 hover:bg-zinc-800 transition-all duration-200 group hover:scale-105 hover:shadow-lg"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 border border-white/20 rounded-lg flex items-center justify-center group-hover:border-white/40 group-hover:scale-110 group-hover:bg-white/5 transition-all duration-200 flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white uppercase group-hover:text-green-400 transition-colors">EQUIPA</h3>
                </div>
              </Link>
              <Link
                href={`/promotor/events/${event.id}/sales`}
                className="bg-zinc-900 border border-white/10 rounded-lg p-4 sm:p-5 hover:border-white/20 hover:bg-zinc-800 transition-all duration-200 group hover:scale-105 hover:shadow-lg"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 border border-white/20 rounded-lg flex items-center justify-center group-hover:border-white/40 group-hover:scale-110 group-hover:bg-white/5 transition-all duration-200 flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white uppercase group-hover:text-green-400 transition-colors">VENDAS</h3>
                </div>
              </Link>
              <Link
                href={`/promotor/events/${event.id}/checkins`}
                className="bg-zinc-900 border border-white/10 rounded-lg p-4 sm:p-5 hover:border-white/20 hover:bg-zinc-800 transition-all duration-200 group hover:scale-105 hover:shadow-lg"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 border border-white/20 rounded-lg flex items-center justify-center group-hover:border-white/40 group-hover:scale-110 group-hover:bg-white/5 transition-all duration-200 flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white uppercase group-hover:text-green-400 transition-colors">LISTA CHECK-INS</h3>
                </div>
              </Link>
              <Link
                href={`/promotor/events/${event.id}/tracking-links`}
                className="bg-zinc-900 border border-white/10 rounded-lg p-4 sm:p-5 hover:border-white/20 hover:bg-zinc-800 transition-all duration-200 group hover:scale-105 hover:shadow-lg"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 border border-white/20 rounded-lg flex items-center justify-center group-hover:border-white/40 group-hover:scale-110 group-hover:bg-white/5 transition-all duration-200 flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white uppercase group-hover:text-green-400 transition-colors">TRACKING LINKS</h3>
                </div>
              </Link>
            </div>
          </div>

          {/* Visual Configuration */}
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white uppercase mb-3 sm:mb-4">
              CONFIGURAÇÃO VISUAL
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <Link
                href={`/promotor/events/${event.id}/branding`}
                className="bg-zinc-900 border border-white/10 rounded-lg p-4 sm:p-5 hover:border-white/20 hover:bg-zinc-800 transition-all duration-200 group cursor-pointer hover:scale-105"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 border border-white/20 rounded-lg flex items-center justify-center group-hover:border-white/40 group-hover:scale-110 group-hover:bg-white/5 transition-all duration-200 flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:rotate-6 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white uppercase group-hover:text-green-400 transition-colors">DESIGN DO EVENTO</h3>
                    <span className="text-[10px] text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded uppercase group-hover:bg-green-400/20 transition-colors">PRO</span>
                  </div>
                </div>
              </Link>
              <Link
                href={`/promotor/events/${event.id}/assets`}
                className="bg-zinc-900 border border-white/10 rounded-lg p-4 sm:p-5 hover:border-white/20 hover:bg-zinc-800 transition-all duration-200 group cursor-pointer hover:scale-105"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 border border-white/20 rounded-lg flex items-center justify-center group-hover:border-white/40 group-hover:scale-110 group-hover:bg-white/5 transition-all duration-200 flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:rotate-6 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white uppercase group-hover:text-blue-400 transition-colors">BIBLIOTECA ASSETS</h3>
                </div>
              </Link>
              <Link
                href="/promotor/analytics"
                className="bg-zinc-900 border border-white/10 rounded-lg p-4 sm:p-5 hover:border-white/20 hover:bg-zinc-800 transition-all duration-200 group cursor-pointer hover:scale-105"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 border border-white/20 rounded-lg flex items-center justify-center group-hover:border-white/40 group-hover:scale-110 group-hover:bg-white/5 transition-all duration-200 flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:rotate-6 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white uppercase group-hover:text-purple-400 transition-colors">ANALÍTICA</h3>
                </div>
              </Link>
            </div>
          </div>

          {/* Event System */}
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white uppercase mb-3 sm:mb-4">
              SISTEMA DO EVENTO
            </h2>
            <div className="flex gap-3">
              <button
                onClick={() => setSystemStatus("ATIVO")}
                className={`px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg font-bold text-xs sm:text-sm uppercase transition-colors ${
                  systemStatus === "ATIVO"
                    ? "bg-purple-500 text-white"
                    : "bg-zinc-900 border border-white/10 text-white/50 hover:text-white"
                }`}
              >
                ATIVO
              </button>
              <button
                onClick={() => setSystemStatus("INATIVO")}
                className={`px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg font-bold text-xs sm:text-sm uppercase transition-colors ${
                  systemStatus === "INATIVO"
                    ? "bg-cyan-500 text-white"
                    : "bg-zinc-900 border border-white/10 text-white/50 hover:text-white"
                }`}
              >
                INATIVO
              </button>
            </div>
          </div>

          {/* Live Environment */}
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white uppercase mb-3 sm:mb-4">
              AMBIENTE LIVE
            </h2>
            <div className="bg-zinc-900 border border-white/10 rounded-lg p-4 sm:p-5 hover:border-white/20 hover:bg-zinc-800 transition-all duration-200 group cursor-pointer hover:scale-[1.02]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 border border-white/20 rounded-lg flex items-center justify-center group-hover:border-white/40 group-hover:scale-110 group-hover:bg-white/5 transition-all duration-200 flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:rotate-6 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white uppercase group-hover:text-white/90 transition-colors">MÁQUINA FÍSICA</h3>
                </div>
                <svg className="w-5 h-5 text-white flex-shrink-0 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Active Monitoring */}
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white uppercase mb-3 sm:mb-4">
              MONITORAMENTO ATIVO
            </h2>
            <div className="bg-zinc-900 border border-green-500/30 rounded-lg p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 border border-green-500/50 rounded-lg flex items-center justify-center bg-green-500/10 flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base lg:text-lg font-bold text-white uppercase mb-1.5">
                    AMBIENTE DE TRABALHO ONLINE.
                  </h3>
                  <p className="text-xs sm:text-sm text-white/70">
                    PROPORCIONA AUDITORIA EM TEMPO REAL DE TODAS AS OPERAÇÕES.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
