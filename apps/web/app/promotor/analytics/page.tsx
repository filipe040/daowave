"use client";

import { useEffect, useState, useCallback } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, TrendingUp, Calendar, Euro } from "lucide-react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

interface DataPoint { date: string; revenueCents: number; }
interface ApiResponse { data: DataPoint[]; from: string; to: string; }

const fmt = (cents: number) =>
    new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(cents / 100);

export default function PromoterAnalyticsPage() {
    const [data, setData] = useState<DataPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await fetchWithTimeout("/api/promotor/analytics");
            if (!res.ok) throw new Error(`Erro ${res.status}`);
            const json: ApiResponse = await res.json();
            setData(json.data);
        } catch (err: unknown) { setError(err instanceof Error ? err.message : "Erro"); }
        finally { setLoading(false); }
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
                        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
                    </div>
                    <Skeleton className="h-64 rounded-2xl" />
                </div>
            )}
            {!loading && error && <ErrorState message={error} onRetry={load} />}
            {!loading && !error && data.length === 0 && (
                <EmptyState icon={BarChart3} title="Sem dados" description="Ainda não existem vendas neste período." />
            )}
            {!loading && !error && data.length > 0 && (
                <div className="space-y-6">
                    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
                        <KpiCard label="Receita Total" value={fmt(totalRevenue)} icon={Euro} iconColor="text-emerald-600" />
                        <KpiCard label="Média Diária" value={fmt(avgDaily)} icon={TrendingUp} iconColor="text-purple-600" />
                        <div className="col-span-2 sm:col-span-1">
                            <KpiCard label="Dias com Vendas" value={String(data.length)} icon={Calendar} iconColor="text-blue-600" />
                        </div>
                    </div>

                    {/* Bar chart */}
                    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-sm font-semibold text-gray-900">Receita por dia</h2>
                            {bestDay && (
                                <span className="text-xs text-gray-400">
                                    Melhor: <span className="text-gray-700 font-medium">{bestDay.date}</span>
                                </span>
                            )}
                        </div>
                        <div className="flex items-end gap-1 h-40 sm:h-52 overflow-x-auto py-1">
                            {data.map((d) => {
                                const pct = (d.revenueCents / maxValue) * 100;
                                return (
                                    <div
                                        key={d.date}
                                        className="group relative flex flex-col items-center flex-1 min-w-[6px] max-w-[24px]"
                                        title={`${d.date}: ${fmt(d.revenueCents)}`}
                                    >
                                        <div
                                            className="w-full rounded-t-sm bg-gray-200 group-hover:bg-gray-900 transition-colors duration-150"
                                            style={{ height: `${Math.max(pct, 2)}%` }}
                                        />
                                        <span className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                                            <span className="bg-gray-900 text-white text-xs rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg">
                                                {d.date} — {fmt(d.revenueCents)}
                                            </span>
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-400 mt-2 border-t border-gray-100 pt-2">
                            <span>{data[0]?.date}</span>
                            <span>{data[data.length - 1]?.date}</span>
                        </div>
                    </div>
                </div>
            )}
        </PageShell>
    );
}
