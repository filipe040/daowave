"use client";

import { useEffect, useState, useCallback } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

interface SystemError {
    id: string;
    message: string;
    level: string;
    timestamp: string;
    context?: Record<string, unknown> | null;
}

export default function AdminSystemPage() {
    const [errors, setErrors] = useState<SystemError[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetchWithTimeout("/api/admin/system/errors");
            if (!res.ok) throw new Error(`Erro ${res.status}`);
            const json = await res.json() as { errors: SystemError[] };
            setErrors(json.errors);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Erro desconhecido");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    return (
        <PageShell
            title="Sistema"
            subtitle="Erros e logs das últimas 24h"
            actions={
                <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    <span className="ml-2 hidden sm:inline">Atualizar</span>
                </Button>
            }
        >
            {loading && (
                <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full rounded-xl" />
                    ))}
                </div>
            )}

            {!loading && error && <ErrorState message={error} onRetry={load} />}

            {!loading && !error && errors.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                    <CheckCircle2 className="h-14 w-14 text-emerald-500" strokeWidth={1.5} />
                    <div>
                        <h3 className="text-lg font-semibold text-white">Sistema operacional</h3>
                        <p className="text-sm text-zinc-400 mt-1">Nenhum erro registado nas últimas 24h.</p>
                    </div>
                </div>
            )}

            {!loading && !error && errors.length > 0 && (
                <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
                        <XCircle className="h-5 w-5 text-red-400 shrink-0" />
                        <span className="text-sm text-red-300 font-medium">
                            {errors.length} ocorrência{errors.length !== 1 ? "s" : ""} nas últimas 24h
                        </span>
                    </div>

                    {/* Error list */}
                    <div className="rounded-xl border border-zinc-700/60 bg-zinc-900/60 overflow-hidden divide-y divide-zinc-700/50">
                        {errors.map((e) => (
                            <div key={e.id} className="p-4 sm:p-5 space-y-2">
                                <div className="flex items-start justify-between gap-3">
                                    <span className="text-sm font-medium text-white leading-snug">{e.message}</span>
                                    <Badge variant="danger" className="shrink-0 text-xs">{e.level}</Badge>
                                </div>
                                <div className="text-xs text-zinc-500">
                                    {new Date(e.timestamp).toLocaleString("pt-PT")}
                                </div>
                                {e.context && (
                                    <pre className="text-xs bg-zinc-800 rounded-lg p-3 overflow-x-auto text-zinc-400 mt-2 border border-zinc-700/60">
                                        {JSON.stringify(e.context, null, 2)}
                                    </pre>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </PageShell>
    );
}
