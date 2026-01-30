"use client";

import Link from "next/link";
import PromoterSidebar from "../../../../components/promoter-sidebar";

interface Event {
  id: string;
  title: string;
  slug: string;
}

interface Stats {
  floatingCapital: number;
  activeAccounts: number;
  totalLoaded: number;
  salesVolume: number;
  refunds: number;
  ledgerHealth: number;
  capitalChange: number;
}

interface CashlessSystemContentProps {
  event: Event;
  stats: Stats;
}

export default function CashlessSystemContent({ event, stats }: CashlessSystemContentProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Fixed Sidebar */}
      <PromoterSidebar eventId={event.id} currentSection="CARTEIRAS" />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto lg:ml-72 pt-12 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 lg:w-7 lg:h-7 border-2 border-purple-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm lg:text-base">$</span>
                </div>
                <div>
                  <div className="mb-1.5">
                    <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-[10px] lg:text-xs uppercase font-semibold">
                      SECURE LEDGER ACTIVE
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold uppercase mb-1.5">
                    <span className="text-white">SISTEMA </span>
                    <span className="text-purple-400">CASHLESS</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-white/70 max-w-2xl">
                    Ecossistema de pagamentos digitais para <span className="text-purple-400 font-semibold">{event.title}</span>. Monitorização transacional em tempo real com integridade de dados bancária.
                  </p>
                </div>
              </div>
            </div>

            {/* Top Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
              {/* Floating Capital */}
              <div className="bg-zinc-900 border border-white/10 rounded-lg p-4 hover:border-purple-500/30 hover:bg-zinc-800 transition-all duration-200 group hover:scale-105 cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] lg:text-xs text-white/50 uppercase">FLOATING CAPITAL</span>
                  <svg className="w-4 h-4 text-green-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="text-2xl lg:text-3xl font-bold text-white mb-1 group-hover:text-purple-400 transition-colors">
                  {formatCurrency(stats.floatingCapital)}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-green-400">
                  <span>+{stats.capitalChange}% vs Período Anterior</span>
                </div>
              </div>

              {/* Active Accounts */}
              <div className="bg-zinc-900 border border-white/10 rounded-lg p-4 hover:border-blue-500/30 hover:bg-zinc-800 transition-all duration-200 group hover:scale-105 cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] lg:text-xs text-white/50 uppercase">CONTAS ATIVAS</span>
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                    <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                  </div>
                </div>
                <div className="text-2xl lg:text-3xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
                  {stats.activeAccounts}
                </div>
                <div className="text-[10px] text-white/50 uppercase">HARDWARE IDENTIFICADO</div>
              </div>
            </div>
          </div>

          {/* Main Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            {/* Total Carregado */}
            <div className="bg-white rounded-lg p-4 hover:shadow-lg hover:scale-105 transition-all duration-200 group cursor-pointer">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <span className="text-[10px] text-zinc-600 uppercase font-semibold">TOTAL CARREGADO</span>
              </div>
              <div className="text-2xl font-bold text-black mb-1">{formatCurrency(stats.totalLoaded)}</div>
              <div className="text-[10px] text-zinc-500 uppercase mb-2">ENTRADA DE CAPITAL</div>
              <div className="w-full bg-zinc-200 rounded-full h-1.5">
                <div className="bg-green-500 h-1.5 rounded-full" style={{ width: "0%" }}></div>
              </div>
            </div>

            {/* Volume Vendas */}
            <div className="bg-white rounded-lg p-4 hover:shadow-lg hover:scale-105 transition-all duration-200 group cursor-pointer">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-blue-600 text-lg font-bold">€</span>
                </div>
                <span className="text-[10px] text-zinc-600 uppercase font-semibold">VOLUME VENDAS</span>
              </div>
              <div className="text-2xl font-bold text-black mb-1">{formatCurrency(stats.salesVolume)}</div>
              <div className="text-[10px] text-zinc-500 uppercase mb-2">TRANSACIONADO NO POS</div>
              <div className="w-full bg-zinc-200 rounded-full h-1.5">
                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: "0%" }}></div>
              </div>
            </div>

            {/* Saídas / Refund */}
            <div className="bg-white rounded-lg p-4 hover:shadow-lg hover:scale-105 transition-all duration-200 group cursor-pointer">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                </div>
                <span className="text-[10px] text-zinc-600 uppercase font-semibold">SAÍDAS / REFUND</span>
              </div>
              <div className="text-2xl font-bold text-black mb-1">{formatCurrency(stats.refunds)}</div>
              <div className="text-[10px] text-zinc-500 uppercase mb-2">CAPITAL RECLAMADO</div>
              <div className="w-full bg-zinc-200 rounded-full h-1.5">
                <div className="bg-red-500 h-1.5 rounded-full" style={{ width: "0%" }}></div>
              </div>
            </div>

            {/* Ledger Health */}
            <div className="bg-white rounded-lg p-4 hover:shadow-lg hover:scale-105 transition-all duration-200 group cursor-pointer">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-[10px] text-zinc-600 uppercase font-semibold">LEDGER HEALTH</span>
              </div>
              <div className="text-2xl font-bold text-black mb-1">{stats.ledgerHealth}%</div>
              <div className="text-[10px] text-zinc-500 uppercase mb-2">SINCRONIZAÇÃO ATIVA</div>
              <div className="w-full bg-zinc-200 rounded-full h-1.5">
                <div className="bg-green-500 h-1.5 rounded-full" style={{ width: "100%" }}></div>
              </div>
            </div>
          </div>

          {/* Financial Console Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg sm:text-xl lg:text-2xl font-bold text-white uppercase">4</span>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white uppercase">CONSOLA FINANCEIRA</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {/* Gestão de Contas */}
                <Link href="#" className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border border-purple-500/30 rounded-lg p-4 hover:border-purple-500/50 hover:bg-purple-900/60 transition-all duration-200 group hover:scale-105">
                  <div className="flex items-center justify-center mb-3">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:bg-purple-500/30 group-hover:scale-110 transition-all duration-200">
                      <svg className="w-5 h-5 lg:w-6 lg:h-6 text-purple-400 group-hover:text-purple-300 group-hover:rotate-3 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-sm lg:text-base font-bold text-white uppercase mb-1.5 group-hover:text-purple-300 transition-colors">
                    • VISÃO GLOBAL DE CLIENTES
                  </h3>
                  <p className="text-[10px] lg:text-xs text-white/50 uppercase mb-2 group-hover:text-white/70 transition-colors">Gestão de Contas</p>
                  <p className="text-[10px] lg:text-xs text-white/70 mb-3 group-hover:text-white/90 transition-colors">
                    Monitorização de saldos, ativação de tags NFC e auditoria individual de contas de participantes.
                  </p>
                  <div className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-[10px] font-semibold uppercase inline-block group-hover:bg-purple-500/30 transition-colors">
                    {stats.activeAccounts} ATIVAS
                  </div>
                </Link>

                {/* Posto de Carregamento */}
                <Link href="#" className="bg-gradient-to-br from-green-900/50 to-green-800/30 border border-green-500/30 rounded-lg p-4 hover:border-green-500/50 hover:bg-green-900/60 transition-all duration-200 group hover:scale-105">
                  <div className="flex items-center justify-center mb-3">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:bg-green-500/30 group-hover:scale-110 transition-all duration-200">
                      <svg className="w-5 h-5 lg:w-6 lg:h-6 text-green-400 group-hover:text-green-300 group-hover:rotate-3 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-sm lg:text-base font-bold text-white uppercase mb-1.5 group-hover:text-green-300 transition-colors">
                    • TOP-UP & ABASTECIMENTO
                  </h3>
                  <p className="text-[10px] lg:text-xs text-white/50 uppercase mb-2 group-hover:text-white/70 transition-colors">Posto de Carregamento</p>
                  <p className="text-[10px] lg:text-xs text-white/70 mb-3 group-hover:text-white/90 transition-colors">
                    Interface otimizada para carregamento rápido de saldo via Cash, Cartão ou MBWay.
                  </p>
                  <div className="bg-green-500/20 text-green-300 px-2 py-1 rounded text-[10px] font-semibold uppercase inline-block group-hover:bg-green-500/30 transition-colors">
                    60 TOTAL
                  </div>
                </Link>

                {/* Explorador de Fluxos */}
                <Link href="#" className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border border-blue-500/30 rounded-lg p-4 hover:border-blue-500/50 hover:bg-blue-900/60 transition-all duration-200 group hover:scale-105">
                  <div className="flex items-center justify-center mb-3">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 group-hover:scale-110 transition-all duration-200">
                      <span className="text-blue-400 text-lg lg:text-xl font-bold group-hover:text-blue-300 group-hover:scale-125 transition-all duration-200">€</span>
                    </div>
                  </div>
                  <h3 className="text-sm lg:text-base font-bold text-white uppercase mb-1.5 group-hover:text-blue-300 transition-colors">
                    • TRANSAÇÕES & AUDITORIA
                  </h3>
                  <p className="text-[10px] lg:text-xs text-white/50 uppercase mb-2 group-hover:text-white/70 transition-colors">Explorador de Fluxos</p>
                  <p className="text-[10px] lg:text-xs text-white/70 mb-3 group-hover:text-white/90 transition-colors">
                    Histórico granular de todas as movimentações financeiras do sistema cashless em tempo real.
                  </p>
                  <div className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-[10px] font-semibold uppercase inline-block group-hover:bg-blue-500/30 transition-colors">
                    REAL-TIME SYNC
                  </div>
                </Link>
              </div>
            </div>

            {/* Protocols Section */}
            <div className="lg:col-span-1">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white uppercase mb-4">
                PROTOCOLOS DE GESTÃO CASHLESS
              </h2>
              <div className="space-y-3">
                <div className="bg-zinc-900 border border-white/10 rounded-lg p-4 hover:border-white/20 hover:bg-zinc-800 transition-all duration-200 group cursor-pointer hover:scale-105">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-green-400 flex-shrink-0 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="text-xs lg:text-sm text-green-400 font-semibold group-hover:text-green-300 transition-colors">SISTEMA ATIVO</span>
                  </div>
                  <p className="text-[10px] lg:text-xs text-white/70 group-hover:text-white/80 transition-colors">
                    Monitorização em tempo real de todas as operações cashless.
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
