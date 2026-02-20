"use client";

import { useEffect, useState, useCallback } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
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
        } catch (err: any) {
            setError(err.message ?? "Erro desconhecido");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const totalRevenue = data.reduce((s, d) => s + d.revenueCents, 0);
    const maxValue = Math.max(...data.map((d) => d.revenueCents), 1);

    return (
        <PageShell
            title="Analytics"
            subtitle="Receita dos últimos 30 dias"
        >
            {loading && (
                <div className="space-y-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-64 w-full" />
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
                    {/* KPI summary */}
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Receita total (30 d)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{fmt(totalRevenue)}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Dias com vendas
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{data.length}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Média diária
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {fmt(data.length > 0 ? totalRevenue / data.length : 0)}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Bar chart (pure CSS) */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Vendas por dia</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-end gap-1 h-48 overflow-x-auto pb-2">
                                {data.map((d) => {
                                    const pct = (d.revenueCents / maxValue) * 100;
                                    return (
                                        <div
                                            key={d.date}
                                            className="group relative flex flex-col items-center gap-1 flex-1 min-w-[12px]"
                                            title={`${d.date}: ${fmt(d.revenueCents)}`}
                                        >
                                            <div
                                                className="w-full bg-primary/80 hover:bg-primary rounded-sm transition-all"
                                                style={{ height: `${pct}%`, minHeight: "4px" }}
                                            />
                                            {/* tooltip */}
                                            <span className="absolute bottom-full mb-1 hidden group-hover:block bg-popover text-popover-foreground text-xs rounded px-2 py-1 whitespace-nowrap shadow z-10">
                                                {d.date}<br />{fmt(d.revenueCents)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                <span>{data[0]?.date}</span>
                                <span>{data[data.length - 1]?.date}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </PageShell>
    );
}
