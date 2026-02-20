"use client";

import { useEffect, useState, useCallback } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, TrendingUp, Calendar, DollarSign } from "lucide-react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

interface DataPoint {
    date: string;
    revenueCents: number;
}

interface ApiResponse {
    data: DataPoint[];
    from: string;
    to: string;
}

const fmt = (cents: number) =>
    new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(cents / 100);

export default function PromoterAnalyticsPage() {
    const [data, setData] = useState<DataPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetchWithTimeout("/api/promotor/analytics");
            if (!res.ok) throw new Error(`Erro ${res.status}`);
            const json: ApiResponse = await res.json();
            setData(json.data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Erro desconhecido");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const totalRevenue = data.reduce((s, d) => s + d.revenueCents, 0);
    const maxValue = Math.max(...data.map((d) => d.revenueCents), 1);
    const avgDaily = data.length > 0 ? totalRevenue / data.length : 0;
    const bestDay = data.reduce<DataPoint | null>((best, d) => (!best || d.revenueCents > best.revenueCents ? d : best), null);

    return (
        <PageShell title="Analytics" subtitle="Receita dos últimos 30 dias">
            {loading && (
                <div className="space-y-4">
                    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
                        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
                    </div>
                    <Skeleton className="h-52 rounded-xl" />
                </div>
            )}

            {!loading && error && <ErrorState message={error} onRetry={load} />}

            {!loading && !error && data.length === 0 && (
                <EmptyState
                    icon={BarChart3}
                    title="Sem dados de vendas"
                    description="Ainda não existem vendas para mostrar neste período."
                />
            )}

            {!loading && !error && data.length > 0 && (
                <div className="space-y-6">
                    {/* KPI grid — 2 cols mobile, 3 cols sm+ */}
                    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
                        {[
                            {
                                icon: DollarSign,
                                label: "Receita total",
                                value: fmt(totalRevenue),
                                color: "text-emerald-400",
                            },
                            {
                                icon: TrendingUp,
                                label: "Média diária",
                                value: fmt(avgDaily),
                                color: "text-purple-400",
                            },
                            {
                                icon: Calendar,
                                label: "Dias com vendas",
                                value: String(data.length),
                                color: "text-amber-400",
                                className: "col-span-2 sm:col-span-1",
                            },
                        ].map(({ icon: Icon, label, value, color, className }) => (
                            <div key={label} className={`rounded-xl border border-zinc-700/60 bg-zinc-900/60 p-4 ${className ?? ""}`}>
                                <div className={`mb-2 ${color}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="text-lg sm:text-2xl font-bold text-white">{value}</div>
                                <div className="text-xs text-zinc-400 mt-0.5">{label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Bar chart */}
                    <div className="rounded-xl border border-zinc-700/60 bg-zinc-900/60 p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-medium text-zinc-300">Receita por dia</h2>
                            {bestDay && (
                                <span className="text-xs text-zinc-500">
                                    Melhor dia: <span className="text-white font-medium">{bestDay.date}</span>
                                </span>
                            )}
                        </div>
                        <div className="flex items-end gap-[3px] h-40 sm:h-52 overflow-x-auto pb-2 -mx-1 px-1">
                            {data.map((d) => {
                                const pct = (d.revenueCents / maxValue) * 100;
                                return (
                                    <div
                                        key={d.date}
                                        className="group relative flex flex-col items-center flex-1 min-w-[8px] max-w-[28px]"
                                        title={`${d.date}: ${fmt(d.revenueCents)}`}
                                    >
                                        <div
                                            className="w-full rounded-t-sm bg-purple-500/70 hover:bg-purple-400 transition-colors"
                                            style={{ height: `${Math.max(pct, 2)}%` }}
                                        />
                                        {/* tooltip */}
                                        <span className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                                            <span className="bg-zinc-800 border border-zinc-600 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg">
                                                {d.date}<br />{fmt(d.revenueCents)}
                                            </span>
                                            <span className="w-2 h-2 bg-zinc-800 border-b border-r border-zinc-600 rotate-45 -mt-[5px]" />
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                            <span>{data[0]?.date}</span>
                            <span>{data[data.length - 1]?.date}</span>
                        </div>
                    </div>
                </div>
            )}
        </PageShell>
    );
}
