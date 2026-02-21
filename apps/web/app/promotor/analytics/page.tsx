"use client";

import { useEffect, useState, useCallback } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { BarChart3, TrendingUp, Calendar, Euro, LayoutGrid } from "lucide-react";
import { api } from "@/lib/api-client";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface DataPoint { date: string; revenueCents: number; }

const fmt = (cents: number) =>
    new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(cents / 100);

export default function PromoterAnalyticsPage() {
    const [data, setData] = useState<DataPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        const { data: res, error: apiErr } = await api.get<{ data: DataPoint[] }>("/api/promotor/analytics");
        if (apiErr) {
            setError(apiErr);
        } else {
            setData(res?.data ?? []);
        }
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const totalRevenue = data.reduce((s, d) => s + d.revenueCents, 0);
    const maxValue = Math.max(...data.map((d) => d.revenueCents), 1);
    const avgDaily = data.length > 0 ? totalRevenue / data.length : 0;
    const bestDay = data.reduce<DataPoint | null>((best, d) => (!best || d.revenueCents > best.revenueCents ? d : best), null);

    return (
        <PageShell
            title="Analytics"
            subtitle="Monitoriza o desempenho financeiro e tendências de vendas da tua organização."
        >
            <div className="space-y-12 pb-20">
                {loading && (
                    <div className="grid gap-6 grid-cols-1 sm:grid-cols-3 animate-pulse">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-44 bg-white/5 rounded-[28px] border border-white/10" />
                        ))}
                    </div>
                )}

                {error && !loading && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-[32px] p-12 text-center">
                        <p className="text-red-400 font-bold mb-6 text-lg">{error}</p>
                        <button
                            onClick={load}
                            className="px-8 py-3 bg-white text-black font-black uppercase tracking-widest text-[12px] rounded-2xl active:scale-95 transition-all shadow-xl shadow-white/5"
                        >
                            Tentar novamente
                        </button>
                    </div>
                )}

                {/* Content */}
                {!loading && !error && (
                    <>
                        {/* KPIs */}
                        <div className="grid gap-6 grid-cols-1 sm:grid-cols-3">
                            <KpiCard
                                label="Receita Total"
                                value={fmt(totalRevenue)}
                                subtitle="Últimos 30 dias"
                                icon={Euro}
                                iconColor="text-emerald-400"
                            />
                            <KpiCard
                                label="Média Diária"
                                value={fmt(avgDaily)}
                                subtitle="Impacto por dia"
                                icon={TrendingUp}
                                iconColor="text-purple-400"
                            />
                            <KpiCard
                                label="Dias Ativos"
                                value={String(data.length)}
                                subtitle="Com volume de vendas"
                                icon={Calendar}
                                iconColor="text-blue-400"
                            />
                        </div>

                        {/* Main Chart Container */}
                        <div className="bg-white/[0.03] backdrop-blur-3xl rounded-[32px] border border-white/10 shadow-2xl p-8 sm:p-12">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-12">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                                        <BarChart3 className="w-5 h-5 text-white/40" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-white uppercase tracking-tight">Fluxo de Receita</h2>
                                        <p className="text-sm text-white/20 font-medium">Distribuição de vendas diárias em Euros</p>
                                    </div>
                                </div>

                                {bestDay && (
                                    <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400/60 block">Melhor Dia</span>
                                        <span className="text-sm font-bold text-emerald-400">{bestDay.date} — {fmt(bestDay.revenueCents)}</span>
                                    </div>
                                )}
                            </div>

                            {/* Chart Area */}
                            <div className="relative group">
                                <div className="flex items-end gap-1.5 h-64 sm:h-80 overflow-x-auto py-2 no-scrollbar">
                                    {data.map((d) => {
                                        const pct = (d.revenueCents / maxValue) * 100;
                                        return (
                                            <div
                                                key={d.date}
                                                className="group/item relative flex flex-col items-center flex-1 min-w-[12px] max-w-[40px]"
                                            >
                                                <div
                                                    className="w-full rounded-t-lg bg-white/5 border-t border-x border-white/10 group-hover/item:bg-white group-hover/item:border-white transition-all duration-300"
                                                    style={{ height: `${Math.max(pct, 4)}%` }}
                                                />

                                                {/* Tooltip */}
                                                <div className="absolute bottom-full mb-4 opacity-0 group-hover/item:opacity-100 transition-all duration-300 pointer-events-none z-20 scale-95 group-hover/item:scale-100">
                                                    <div className="bg-white text-black rounded-2xl px-4 py-3 shadow-2xl shadow-black/50 border border-white/20 whitespace-nowrap">
                                                        <div className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-1">{d.date}</div>
                                                        <div className="text-base font-black">{fmt(d.revenueCents)}</div>
                                                    </div>
                                                    <div className="w-3 h-3 bg-white rotate-45 mx-auto -mt-1.5 border-b border-r border-white/20" />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* X-Axis labels */}
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-white/10 mt-8 pt-8 border-t border-white/5">
                                <span>{data[0]?.date || "Início"}</span>
                                <div className="flex items-center gap-2">
                                    <LayoutGrid className="w-3 h-3" />
                                    <span>Vendas Brutas (30 d)</span>
                                </div>
                                <span>{data[data.length - 1]?.date || "Fim"}</span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </PageShell>
    );
}
