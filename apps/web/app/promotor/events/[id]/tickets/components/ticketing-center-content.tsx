"use client";

import { useState } from "react";
import Link from "next/link";
import PromoterSidebar from "../../../../components/promoter-sidebar";
import Breadcrumbs from "@/app/components/breadcrumbs";
import NewCategoryModal from "./new-category-modal";
import BadgeDesignerModal from "./badge-designer-modal";

interface Event {
  id: string;
  title: string;
  slug: string;
}

interface Stats {
  ticketsIssued: number;
  confirmedSales: number;
  validatedRevenue: number;
  conversionRate: number;
  totalAudience: number;
}

interface BadgeDesign {
  templateImageUrl: string | null;
  prefix: string | null;
}

interface TicketingCenterContentProps {
  event: Event;
  stats: Stats;
  badgeDesign?: BadgeDesign;
}

export default function TicketingCenterContent({ event, stats, badgeDesign }: TicketingCenterContentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBadgeDesignerOpen, setIsBadgeDesignerOpen] = useState(false);
  const revenueInEuros = (stats.validatedRevenue / 100).toFixed(2);

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Fixed Sidebar */}
      <PromoterSidebar eventId={event.id} currentSection="BILHÉTICA & RECEITA" />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto lg:ml-56 xl:ml-64 pt-12 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Breadcrumbs */}
          <Breadcrumbs
            items={[
              { label: "ESTÚDIO", href: `/promotor/events/${event.id}` },
              { label: "BILHÉTICA & RECEITA", active: true },
            ]}
          />

          {/* Header */}
          <div className="mb-6 mt-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 lg:w-7 lg:h-7 border-2 border-green-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm lg:text-base">Σ</span>
                </div>
                <div>
                  <div className="mb-1.5">
                    <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-[10px] lg:text-xs uppercase font-semibold">
                      MÓDULO DE EMISSÃO ATIVO
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold uppercase mb-1.5">
                    <span className="text-white">CENTRO DE </span>
                    <span className="text-green-400">BILHÉTICA</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-white/70 max-w-2xl">
                    GESTÃO ESTRATÉGICA DE INVENTÁRIO, FLUXOS DE VENDAS E OTIMIZAÇÃO DE RECEITA PARA {event.title.toUpperCase()}.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 self-start sm:self-auto">
                <button
                  onClick={() => setIsBadgeDesignerOpen(true)}
                  className="bg-blue-600 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg font-bold text-xs sm:text-sm uppercase hover:bg-blue-700 transition-colors whitespace-nowrap flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                  Badge Designer
                </button>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-green-500 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg font-bold text-xs sm:text-sm uppercase hover:bg-green-600 transition-colors whitespace-nowrap"
                >
                  + NOVA CATEGORIA
                </button>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            {/* BILHETES EMITIDOS */}
            <div className="bg-zinc-900 border border-white/10 rounded-lg p-4 relative hover:border-green-500/30 hover:bg-zinc-800 transition-all duration-200 group hover:scale-105 cursor-pointer">
              <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-green-500 rounded-full group-hover:scale-125 group-hover:animate-pulse transition-all"></div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-green-500/20 group-hover:scale-110 transition-all duration-200">
                  <svg className="w-4 h-4 lg:w-5 lg:h-5 text-white group-hover:text-green-400 group-hover:rotate-3 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
              </div>
              <div className="text-2xl lg:text-3xl font-bold text-white mb-0.5 group-hover:text-green-400 transition-colors">{stats.ticketsIssued}</div>
              <div className="text-[10px] lg:text-xs text-white/70 uppercase mb-0.5 group-hover:text-white/90 transition-colors">BILHETES EMITIDOS</div>
              <div className="text-[10px] text-white/50 group-hover:text-white/70 transition-colors">VENDAS CONFIRMADAS</div>
            </div>

            {/* RECEITA VALIDADA */}
            <div className="bg-zinc-900 border border-white/10 rounded-lg p-4 relative hover:border-green-500/30 hover:bg-zinc-800 transition-all duration-200 group hover:scale-105 cursor-pointer">
              <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-green-500 rounded-full group-hover:scale-125 group-hover:animate-pulse transition-all"></div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-green-500/20 group-hover:scale-110 transition-all duration-200">
                  <span className="text-white text-lg lg:text-xl font-bold group-hover:text-green-400 group-hover:scale-125 transition-all duration-200">€</span>
                </div>
              </div>
              <div className="text-2xl lg:text-3xl font-bold text-white mb-0.5 group-hover:text-green-400 transition-colors">{revenueInEuros} €</div>
              <div className="text-[10px] lg:text-xs text-white/70 uppercase mb-0.5 group-hover:text-white/90 transition-colors">RECEITA VALIDADA</div>
              <div className="text-[10px] text-white/50 group-hover:text-white/70 transition-colors">FLUXO ACUMULADO</div>
            </div>

            {/* CONVERSÃO REAL */}
            <div className="bg-zinc-900 border border-white/10 rounded-lg p-4 relative hover:border-green-500/30 hover:bg-zinc-800 transition-all duration-200 group hover:scale-105 cursor-pointer">
              <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-green-500 rounded-full group-hover:scale-125 group-hover:animate-pulse transition-all"></div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-green-500/20 group-hover:scale-110 transition-all duration-200">
                  <svg className="w-4 h-4 lg:w-5 lg:h-5 text-white group-hover:text-green-400 group-hover:rotate-3 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="text-2xl lg:text-3xl font-bold text-white mb-0.5 group-hover:text-green-400 transition-colors">{stats.conversionRate.toFixed(1)}%</div>
              <div className="text-[10px] lg:text-xs text-white/70 uppercase mb-0.5 group-hover:text-white/90 transition-colors">CONVERSÃO REAL</div>
              <div className="text-[10px] text-white/50 group-hover:text-white/70 transition-colors">TAXA DE CHECKOUT</div>
            </div>

            {/* TOTAL AUDIÊNCIA */}
            <div className="bg-zinc-900 border border-white/10 rounded-lg p-4 relative hover:border-green-500/30 hover:bg-zinc-800 transition-all duration-200 group hover:scale-105 cursor-pointer">
              <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-green-500 rounded-full group-hover:scale-125 group-hover:animate-pulse transition-all"></div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-green-500/20 group-hover:scale-110 transition-all duration-200">
                  <svg className="w-4 h-4 lg:w-5 lg:h-5 text-white group-hover:text-green-400 group-hover:rotate-3 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
              <div className="text-2xl lg:text-3xl font-bold text-white mb-0.5 group-hover:text-green-400 transition-colors">{stats.totalAudience}</div>
              <div className="text-[10px] lg:text-xs text-white/70 uppercase mb-0.5 group-hover:text-white/90 transition-colors">TOTAL AUDIÊNCIA</div>
              <div className="text-[10px] text-white/50 group-hover:text-white/70 transition-colors">CHECK-INS ESPERADOS</div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* PROTOCOLOS OPERATIVOS */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-4 h-4 lg:w-5 lg:h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white uppercase">PROTOCOLOS OPERATIVOS</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {/* EMITIR BILHETES */}
                <Link href="#" className="bg-zinc-900 border border-white/10 rounded-lg p-4 hover:border-green-500/50 hover:bg-zinc-800 transition-all duration-200 group hover:scale-105 hover:shadow-lg hover:shadow-green-500/20">
                  <div className="flex items-center justify-center mb-3">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:bg-green-500/30 group-hover:scale-110 transition-all duration-200">
                      <svg className="w-5 h-5 lg:w-6 lg:h-6 text-green-400 group-hover:text-green-300 group-hover:rotate-3 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-sm lg:text-base font-bold text-white uppercase mb-1.5 group-hover:text-green-400 transition-colors">EMITIR BILHETES</h3>
                  <p className="text-[10px] lg:text-xs text-white/50 uppercase mb-3 group-hover:text-white/70 transition-colors">PROTOCOLO DE ENVIO MANUAL E EM MASSA</p>
                  <div className="text-white text-xs lg:text-sm group-hover:text-green-400 transition-colors flex items-center gap-1.5">
                    ACEDER INTERFACE <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </Link>

                {/* BASE DE DADOS */}
                <Link href="#" className="bg-zinc-900 border border-white/10 rounded-lg p-4 hover:border-blue-500/50 hover:bg-zinc-800 transition-all duration-200 group hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20">
                  <div className="flex items-center justify-center mb-3">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 group-hover:scale-110 transition-all duration-200">
                      <svg className="w-5 h-5 lg:w-6 lg:h-6 text-blue-400 group-hover:text-blue-300 group-hover:rotate-3 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-sm lg:text-base font-bold text-white uppercase mb-1.5 group-hover:text-blue-400 transition-colors">BASE DE DADOS</h3>
                  <p className="text-[10px] lg:text-xs text-white/50 uppercase mb-3 group-hover:text-white/70 transition-colors">EXPLORADOR CENTRALIZADO DE EMISSÕES</p>
                  <div className="text-white text-xs lg:text-sm group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                    ACEDER INTERFACE <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </Link>

                {/* CATEGORIAS */}
                <Link href="#" className="bg-zinc-900 border border-white/10 rounded-lg p-4 hover:border-teal-500/50 hover:bg-zinc-800 transition-all duration-200 group hover:scale-105 hover:shadow-lg hover:shadow-teal-500/20">
                  <div className="flex items-center justify-center mb-3">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-teal-500/20 rounded-lg flex items-center justify-center group-hover:bg-teal-500/30 group-hover:scale-110 transition-all duration-200">
                      <svg className="w-5 h-5 lg:w-6 lg:h-6 text-teal-400 group-hover:text-teal-300 group-hover:rotate-3 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-sm lg:text-base font-bold text-white uppercase mb-1.5 group-hover:text-teal-400 transition-colors">CATEGORIAS</h3>
                  <p className="text-[10px] lg:text-xs text-white/50 uppercase mb-3 group-hover:text-white/70 transition-colors">CONFIGURAÇÃO DE TIPOS E VISIBILIDADE</p>
                  <div className="text-white text-xs lg:text-sm group-hover:text-teal-400 transition-colors flex items-center gap-1.5">
                    ACEDER INTERFACE <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </Link>

                {/* LOTES DINÂMICOS */}
                <Link href="#" className="bg-zinc-900 border border-white/10 rounded-lg p-4 hover:border-purple-500/50 hover:bg-zinc-800 transition-all duration-200 group hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20">
                  <div className="flex items-center justify-center mb-3">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:bg-purple-500/30 group-hover:scale-110 transition-all duration-200">
                      <svg className="w-5 h-5 lg:w-6 lg:h-6 text-purple-400 group-hover:text-purple-300 group-hover:rotate-3 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-sm lg:text-base font-bold text-white uppercase mb-1.5 group-hover:text-purple-400 transition-colors">LOTES DINÂMICOS</h3>
                  <p className="text-[10px] lg:text-xs text-white/50 uppercase mb-3 group-hover:text-white/70 transition-colors">DETEÇÃO DE FASES E CONTROLE DE STOCK</p>
                  <div className="text-white text-xs lg:text-sm group-hover:text-purple-400 transition-colors flex items-center gap-1.5">
                    ACEDER INTERFACE <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </Link>

                {/* DESCONTOS */}
                <Link href="#" className="bg-zinc-900 border border-white/10 rounded-lg p-4 hover:border-green-500/50 hover:bg-zinc-800 transition-all duration-200 group hover:scale-105 hover:shadow-lg hover:shadow-green-500/20">
                  <div className="flex items-center justify-center mb-3">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:bg-green-500/30 group-hover:scale-110 transition-all duration-200">
                      <span className="text-green-400 text-lg lg:text-xl font-bold group-hover:text-green-300 group-hover:scale-125 transition-all duration-200">%</span>
                    </div>
                  </div>
                  <h3 className="text-sm lg:text-base font-bold text-white uppercase mb-1.5 group-hover:text-green-400 transition-colors">DESCONTOS</h3>
                  <p className="text-[10px] lg:text-xs text-white/50 uppercase mb-3 group-hover:text-white/70 transition-colors">GESTÃO DE VOUCHERS E CAMPANHAS ACTIVE</p>
                  <div className="text-white text-xs lg:text-sm group-hover:text-green-400 transition-colors flex items-center gap-1.5">
                    ACEDER INTERFACE <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </Link>

                {/* REEMBOLSOS */}
                <Link href="#" className="bg-zinc-900 border border-white/10 rounded-lg p-4 hover:border-red-500/50 hover:bg-zinc-800 transition-all duration-200 group hover:scale-105 hover:shadow-lg hover:shadow-red-500/20">
                  <div className="flex items-center justify-center mb-3">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-red-500/20 rounded-lg flex items-center justify-center group-hover:bg-red-500/30 group-hover:scale-110 transition-all duration-200">
                      <svg className="w-5 h-5 lg:w-6 lg:h-6 text-red-400 group-hover:text-red-300 group-hover:rotate-3 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-sm lg:text-base font-bold text-white uppercase mb-1.5 group-hover:text-red-400 transition-colors">REEMBOLSOS</h3>
                  <p className="text-[10px] lg:text-xs text-white/50 uppercase mb-3 group-hover:text-white/70 transition-colors">INTERFACE DE ESTORNO E CANCELAMENTO</p>
                  <div className="text-white text-xs lg:text-sm group-hover:text-red-400 transition-colors flex items-center gap-1.5">
                    ACEDER INTERFACE <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </Link>

                {/* GUESTLIST */}
                <Link href="#" className="bg-zinc-900 border border-white/10 rounded-lg p-4 hover:border-pink-500/50 hover:bg-zinc-800 transition-all duration-200 group hover:scale-105 hover:shadow-lg hover:shadow-pink-500/20">
                  <div className="flex items-center justify-center mb-3">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-pink-500/20 rounded-lg flex items-center justify-center group-hover:bg-pink-500/30 group-hover:scale-110 transition-all duration-200">
                      <svg className="w-5 h-5 lg:w-6 lg:h-6 text-pink-400 group-hover:text-pink-300 group-hover:rotate-3 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-sm lg:text-base font-bold text-white uppercase mb-1.5 group-hover:text-pink-400 transition-colors">GUESTLIST</h3>
                  <p className="text-[10px] lg:text-xs text-white/50 uppercase mb-3 group-hover:text-white/70 transition-colors">DISTRIBUIÇÃO VIP, PRESS E PROTOCOLO</p>
                  <div className="text-white text-xs lg:text-sm group-hover:text-pink-400 transition-colors flex items-center gap-1.5">
                    ACEDER INTERFACE <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </Link>

                {/* BADGE DESIGNER */}
                <Link href="#" className="bg-zinc-900 border border-white/10 rounded-lg p-4 hover:border-teal-500/50 hover:bg-zinc-800 transition-all duration-200 group hover:scale-105 hover:shadow-lg hover:shadow-teal-500/20">
                  <div className="flex items-center justify-center mb-3">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-teal-500/20 rounded-lg flex items-center justify-center group-hover:bg-teal-500/30 group-hover:scale-110 transition-all duration-200">
                      <svg className="w-5 h-5 lg:w-6 lg:h-6 text-teal-400 group-hover:text-teal-300 group-hover:rotate-3 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-sm lg:text-base font-bold text-white uppercase mb-1.5 group-hover:text-teal-400 transition-colors">BADGE DESIGNER</h3>
                  <p className="text-[10px] lg:text-xs text-white/50 uppercase mb-3 group-hover:text-white/70 transition-colors">PERSONALIZAÇÃO DE IDENTIDADE FÍSICA</p>
                  <div className="text-white text-xs lg:text-sm group-hover:text-teal-400 transition-colors flex items-center gap-1.5">
                    ACEDER INTERFACE <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </Link>

                {/* STANDBY */}
                <div className="bg-zinc-900 border border-white/10 rounded-lg p-4 opacity-50">
                  <div className="flex items-center justify-center mb-3">
                    <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-white/30 uppercase">STANDBY</h3>
                </div>
              </div>
            </div>

            {/* LIVE FEED */}
            <div className="lg:col-span-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 lg:w-5 lg:h-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white uppercase">LIVE FEED</h2>
                </div>
                <div className="flex items-center gap-2 sm:ml-auto">
                  <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs lg:text-sm text-white">Bem-vindo à 5IVE TICKETS</span>
                </div>
              </div>

              <div className="space-y-3">
                {/* STANDBY Card */}
                <div className="bg-zinc-900 border border-white/10 rounded-lg p-4 opacity-50">
                  <div className="flex items-center justify-center mb-3">
                    <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-white/30 uppercase text-center">STANDBY</h3>
                </div>

                {/* HTTPS Card */}
                <div className="bg-zinc-900 border border-white/10 rounded-lg p-4 hover:border-green-500/30 hover:bg-zinc-800 transition-all duration-200 group">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-400 flex-shrink-0 group-hover:scale-110 group-hover:animate-pulse transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="text-xs lg:text-sm text-green-400 font-semibold group-hover:text-green-300 transition-colors">CRIPTOGRAFIA HTTPS ATIVA</span>
                  </div>
                </div>

                {/* Insight Card */}
                <div className="bg-zinc-900 border border-white/10 rounded-lg p-4 relative overflow-hidden hover:border-green-500/30 hover:bg-zinc-800 transition-all duration-200 group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 rounded-full blur-xl group-hover:bg-green-500/20 group-hover:scale-125 transition-all duration-300"></div>
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-green-400 flex-shrink-0 group-hover:scale-110 group-hover:rotate-12 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="text-xs lg:text-sm text-green-400 font-semibold group-hover:text-green-300 transition-colors">INSIGHT OPERATIVO</span>
                    </div>
                    <p className="text-[10px] lg:text-xs text-white/70 italic group-hover:text-white/80 transition-colors">
                      "OTIMIZAÇÃO DE CHECKOUT EM TEMPO REAL VIA BALANCEAMENTO DE CARGA 5IVE TICKETS CLOUD."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* New Category Modal */}
      <NewCategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        eventId={event.id}
      />
      
      {/* Badge Designer Modal */}
      {isBadgeDesignerOpen && (
        <BadgeDesignerModal
          eventId={event.id}
          eventTitle={event.title}
          currentDesign={badgeDesign}
          onClose={() => setIsBadgeDesignerOpen(false)}
        />
      )}
    </div>
  );
}
