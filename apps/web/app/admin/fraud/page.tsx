"use client";

import { useEffect, useState, useCallback } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, AlertTriangle, RefreshCw } from "lucide-react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

interface DuplicateCheckin {
    ticketId: string;
    _count: { id: number };
}

interface AnomalousUser {
    userId: string;
    ordersInOneHour: number;
}

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
        setLoading(true);
        setError(null);
        try {
            const res = await fetchWithTimeout("/api/admin/fraud");
            if (!res.ok) throw new Error(`Erro ${res.status}`);
            setData(await res.json() as FraudData);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Erro desconhecido");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const clean = data && data.duplicateCheckinsByTicket === 0 && data.anomalousUsers.length === 0;

    return (
        <PageShell
            title="Anti-Fraude"
            subtitle="Deteção de padrões suspeitos"
            actions={
                <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    <span className="ml-2 hidden sm:inline">Atualizar</span>
                </Button>
            }
        >
            {loading && (
                <div className="space-y-4">
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                        <Skeleton className="h-28 rounded-xl" />
                        <Skeleton className="h-28 rounded-xl" />
                    </div>
                    <Skeleton className="h-48 rounded-xl" />
                </div>
            )}

            {!loading && error && <ErrorState message={error} onRetry={load} />}

            {!loading && !error && clean && (
                <EmptyState
                    icon={ShieldCheck}
                    title="Sistema limpo"
                    description="Nenhum sinal de fraude detetado."
                />
            )}

            {!loading && !error && data && !clean && (
                <div className="space-y-6">
                    {/* Summary cards */}
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                        {/* Duplicate check-ins */}
                        <div className={`rounded-xl border p-5 ${data.duplicateCheckinsByTicket > 0 ? "border-red-500/40 bg-red-500/10" : "border-zinc-700/60 bg-zinc-900/60"}`}>
                            <div className="flex items-center gap-2 mb-3">
                                <AlertTriangle className={`h-5 w-5 ${data.duplicateCheckinsByTicket > 0 ? "text-red-400" : "text-zinc-500"}`} />
                                <span className="text-sm font-medium text-zinc-300">Check-ins Duplicados</span>
                            </div>
                            <div className={`text-3xl font-bold ${data.duplicateCheckinsByTicket > 0 ? "text-red-400" : "text-zinc-400"}`}>
                                {data.duplicateCheckinsByTicket}
                            </div>
                            <p className="text-xs text-zinc-500 mt-1">Bilhetes com &gt;1 check-in</p>
                        </div>

                        {/* Anomalous users */}
                        <div className={`rounded-xl border p-5 ${data.anomalousUsers.length > 0 ? "border-red-500/40 bg-red-500/10" : "border-zinc-700/60 bg-zinc-900/60"}`}>
                            <div className="flex items-center gap-2 mb-3">
                                <AlertTriangle className={`h-5 w-5 ${data.anomalousUsers.length > 0 ? "text-red-400" : "text-zinc-500"}`} />
                                <span className="text-sm font-medium text-zinc-300">Utilizadores Anómalos</span>
                            </div>
                            <div className={`text-3xl font-bold ${data.anomalousUsers.length > 0 ? "text-red-400" : "text-zinc-400"}`}>
                                {data.anomalousUsers.length}
                            </div>
                            <p className="text-xs text-zinc-500 mt-1">5+ encomendas/hora</p>
                        </div>
                    </div>

                    {/* Duplicate check-in list */}
                    {data.duplicateCheckinsSample.length > 0 && (
                        <div className="rounded-xl border border-zinc-700/60 bg-zinc-900/60 overflow-hidden">
                            <div className="px-5 py-3 border-b border-zinc-700/60">
                                <h2 className="text-sm font-medium text-zinc-300">Bilhetes com check-in duplicado (amostra)</h2>
                            </div>
                            <div className="divide-y divide-zinc-700/50">
                                {data.duplicateCheckinsSample.map((d) => (
                                    <div key={d.ticketId} className="flex items-center justify-between px-5 py-3">
                                        <span className="font-mono text-xs text-zinc-400 truncate">{d.ticketId}</span>
                                        <Badge variant="danger">{d._count.id} check-ins</Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Anomalous user list */}
                    {data.anomalousUsers.length > 0 && (
                        <div className="rounded-xl border border-zinc-700/60 bg-zinc-900/60 overflow-hidden">
                            <div className="px-5 py-3 border-b border-zinc-700/60">
                                <h2 className="text-sm font-medium text-zinc-300">Utilizadores com atividade suspeita</h2>
                            </div>
                            <div className="divide-y divide-zinc-700/50">
                                {data.anomalousUsers.map((u) => (
                                    <div key={u.userId} className="flex items-center justify-between px-5 py-3">
                                        <span className="font-mono text-xs text-zinc-400 truncate">{u.userId}</span>
                                        <Badge variant="danger">{u.ordersInOneHour} enc./hora</Badge>
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
