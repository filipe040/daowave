"use client";

import { useEffect, useState, useCallback } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, AlertTriangle, RefreshCw } from "lucide-react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

interface DuplicateCheckin { ticketId: string; _count: { id: number } }
interface AnomalousUser { userId: string; ordersInOneHour: number }
interface FraudData {
    duplicateCheckinsByTicket: number;
    duplicateCheckinsSample: DuplicateCheckin[];
    anomalousUsers: AnomalousUser[];
}

export default function AdminFraudPage() {
    const [data, setData] = useState<FraudData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await fetchWithTimeout("/api/admin/fraud");
            if (!res.ok) throw new Error(`Erro ${res.status}`);
            setData(await res.json() as FraudData);
        } catch (err: unknown) { setError(err instanceof Error ? err.message : "Erro"); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const clean = data && data.duplicateCheckinsByTicket === 0 && data.anomalousUsers.length === 0;

    const refreshBtn = (
        <button onClick={load} disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Atualizar</span>
        </button>
    );

    return (
        <PageShell title="Anti-Fraude" subtitle="Deteção de padrões suspeitos" actions={refreshBtn}>
            {loading && (
                <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Skeleton className="h-32 rounded-2xl" />
                        <Skeleton className="h-32 rounded-2xl" />
                    </div>
                    <Skeleton className="h-52 rounded-2xl" />
                </div>
            )}
            {!loading && error && <ErrorState message={error} onRetry={load} />}
            {!loading && !error && clean && (
                <EmptyState icon={ShieldCheck} title="Sistema limpo" description="Nenhum sinal de fraude detetado." />
            )}
            {!loading && !error && data && !clean && (
                <div className="space-y-6">
                    {/* Summary cards */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        {[
                            {
                                value: data.duplicateCheckinsByTicket,
                                label: "Check-ins Duplicados",
                                sub: "Bilhetes com >1 check-in",
                            },
                            {
                                value: data.anomalousUsers.length,
                                label: "Utilizadores Anómalos",
                                sub: "5+ encomendas/hora",
                            },
                        ].map(({ value, label, sub }) => {
                            const isAlert = value > 0;
                            return (
                                <div key={label} className={`bg-white rounded-2xl border shadow-sm p-6 ${isAlert ? "border-amber-200" : "border-gray-200/80"}`}>
                                    <div className={`flex items-center gap-2 mb-3 ${isAlert ? "text-amber-500" : "text-gray-400"}`}>
                                        <AlertTriangle className="h-4 w-4" strokeWidth={1.75} />
                                        <span className="text-xs font-medium text-gray-500">{label}</span>
                                    </div>
                                    <p className={`text-3xl font-semibold tracking-tight ${isAlert ? "text-amber-600" : "text-gray-300"}`}>{value}</p>
                                    <p className="text-xs text-gray-400 mt-1">{sub}</p>
                                </div>
                            );
                        })}
                    </div>

                    {data.duplicateCheckinsSample.length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100">
                                <h2 className="text-sm font-semibold text-gray-900">Check-ins duplicados (amostra)</h2>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {data.duplicateCheckinsSample.map((d) => (
                                    <div key={d.ticketId} className="flex items-center justify-between px-6 py-3.5">
                                        <span className="font-mono text-xs text-gray-500 truncate">{d.ticketId}</span>
                                        <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                                            {d._count.id}× check-in
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {data.anomalousUsers.length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100">
                                <h2 className="text-sm font-semibold text-gray-900">Atividade suspeita</h2>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {data.anomalousUsers.map((u) => (
                                    <div key={u.userId} className="flex items-center justify-between px-6 py-3.5">
                                        <span className="font-mono text-xs text-gray-500 truncate">{u.userId}</span>
                                        <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                                            {u.ordersInOneHour} enc./hora
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </PageShell>
    );
}
