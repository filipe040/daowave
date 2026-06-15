"use client";

import { useEffect, useState, useCallback } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
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
        setLoading(true); setError(null);
        try {
            const res = await fetchWithTimeout("/api/admin/system/errors");
            if (!res.ok) throw new Error(`Erro ${res.status}`);
            const json = await res.json() as { errors: SystemError[] };
            setErrors(json.errors);
        } catch (err: unknown) { setError(err instanceof Error ? err.message : "Erro"); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const refreshBtn = (
        <button onClick={load} disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border border-gray-200 bg-[#14141f] text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Atualizar</span>
        </button>
    );

    return (
        <PageShell title="Sistema" subtitle="Logs das últimas 24h" actions={refreshBtn}>
            {loading && (
                <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
                </div>
            )}
            {!loading && error && <ErrorState message={error} onRetry={load} />}

            {!loading && !error && errors.length === 0 && (
                <div className="bg-[#14141f] rounded-2xl border border-gray-200/80 shadow-sm">
                    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-5">
                            <CheckCircle2 className="w-6 h-6 text-emerald-500" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 mb-1">Sistema operacional</h3>
                        <p className="text-sm text-gray-400">Nenhum erro nas últimas 24h.</p>
                    </div>
                </div>
            )}

            {!loading && !error && errors.length > 0 && (
                <div className="space-y-4">
                    {/* Alert header */}
                    <div className="flex items-center gap-3 bg-amber-50 border border-amber-200/80 rounded-2xl px-5 py-4">
                        <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" strokeWidth={1.75} />
                        <span className="text-sm text-amber-700 font-medium">
                            {errors.length} ocorrência{errors.length !== 1 ? "s" : ""} nas últimas 24 horas
                        </span>
                    </div>

                    {/* Error list */}
                    <div className="bg-[#14141f] rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden divide-y divide-gray-50">
                        {errors.map((e) => (
                            <div key={e.id} className="p-5 sm:p-6 space-y-2">
                                <div className="flex items-start justify-between gap-3">
                                    <span className="text-sm font-medium text-gray-900 leading-snug">{e.message}</span>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-red-50 text-red-600 shrink-0">
                                        {e.level}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400">
                                    {new Date(e.timestamp).toLocaleString("pt-PT")}
                                </p>
                                {e.context && (
                                    <pre className="text-xs bg-gray-50 rounded-xl p-4 overflow-x-auto text-gray-500 border border-gray-100 mt-2">
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
