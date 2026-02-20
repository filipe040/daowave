"use client";

import { useEffect, useState, useCallback } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

interface SystemError {
    id: string;
    message: string;
    level: string;
    timestamp: string;
    context?: Record<string, unknown> | null;
}

interface ApiResponse {
    errors: SystemError[];
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
            const json: ApiResponse = await res.json();
            setErrors(json.errors);
        } catch (err: any) {
            setError(err.message ?? "Erro desconhecido");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    return (
        <PageShell
            title="Sistema"
            subtitle="Erros e logs do sistema nas últimas 24h"
            actions={
                <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                    Atualizar
                </Button>
            }
        >
            {loading && (
                <div className="space-y-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full rounded-lg" />
                    ))}
                </div>
            )}

            {!loading && error && <ErrorState message={error} onRetry={load} />}

            {!loading && !error && errors.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <CheckCircle2 className="h-12 w-12 text-green-500" strokeWidth={1.5} />
                    <h3 className="font-semibold">Sistema operacional</h3>
                    <p className="text-sm text-muted-foreground">
                        Nenhum erro registado nas últimas 24h.
                    </p>
                </div>
            )}

            {!loading && !error && errors.length > 0 && (
                <div className="space-y-4">
                    {/* Summary */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <XCircle className="h-4 w-4 text-destructive" />
                                {errors.length} ocorrência{errors.length !== 1 ? "s" : ""} nas últimas 24h
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground">
                                Inclui erros de auditoria e falhas de email.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Error list */}
                    <div className="space-y-2">
                        {errors.map((e) => (
                            <div key={e.id} className="rounded-md border border-destructive/30 bg-destructive/5 p-4 space-y-1">
                                <div className="flex items-start justify-between gap-4">
                                    <span className="text-sm font-medium leading-snug">{e.message}</span>
                                    <Badge variant="danger" className="shrink-0 text-xs">
                                        {e.level}
                                    </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {new Date(e.timestamp).toLocaleString("pt-PT")}
                                </div>
                                {e.context && (
                                    <pre className="text-xs bg-muted rounded p-2 overflow-x-auto mt-2">
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
