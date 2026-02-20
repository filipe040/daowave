"use client";

import { useEffect, useState, useCallback } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldAlert, AlertTriangle, RefreshCw } from "lucide-react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

interface DuplicateCheckin {
    ticketId: string;
    _count: { id: number };
}

interface AnomalousUser {
    userId: string;
    ordersInOneHour: number;
}

interface ApiResponse {
    duplicateCheckinsByTicket: number;
    duplicateCheckinsSample: DuplicateCheckin[];
    anomalousUsers: AnomalousUser[];
}

export default function AdminFraudPage() {
    const [data, setData] = useState<ApiResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetchWithTimeout("/api/admin/fraud");
            if (!res.ok) throw new Error(`Erro ${res.status}`);
            const json: ApiResponse = await res.json();
            setData(json);
        } catch (err: any) {
            setError(err.message ?? "Erro desconhecido");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const noIssues =
        data &&
        data.duplicateCheckinsByTicket === 0 &&
        data.anomalousUsers.length === 0;

    return (
        <PageShell
            title="Anti-Fraude"
            subtitle="Deteção de padrões suspeitos em tempo real"
            actions={
                <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                    Atualizar
                </Button>
            }
        >
            {loading && (
                <div className="space-y-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            )}

            {!loading && error && <ErrorState message={error} onRetry={load} />}

            {!loading && !error && noIssues && (
                <EmptyState
                    icon={ShieldAlert}
                    title="Sem alertas"
                    description="Nenhum sinal de fraude detetado. O sistema está limpo."
                />
            )}

            {!loading && !error && data && !noIssues && (
                <div className="space-y-6">
                    {/* Summary cards */}
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                        <Card className={data.duplicateCheckinsByTicket > 0 ? "border-destructive" : ""}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-destructive" />
                                    Check-ins Duplicados
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-destructive">
                                    {data.duplicateCheckinsByTicket}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Bilhetes com mais de 1 check-in registado
                                </p>
                            </CardContent>
                        </Card>

                        <Card className={data.anomalousUsers.length > 0 ? "border-destructive" : ""}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-destructive" />
                                    Utilizadores Anómalos
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-destructive">
                                    {data.anomalousUsers.length}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    5+ encomendas na mesma hora
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Duplicate check-ins sample */}
                    {data.duplicateCheckinsSample.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Bilhetes com Check-in Duplicado (amostra)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {data.duplicateCheckinsSample.map((d) => (
                                        <div
                                            key={d.ticketId}
                                            className="flex items-center justify-between text-sm border rounded px-3 py-2"
                                        >
                                            <span className="font-mono text-xs">{d.ticketId}</span>
                                            <Badge variant="danger">{d._count.id} check-ins</Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Anomalous users */}
                    {data.anomalousUsers.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Utilizadores com Atividade Suspeita</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {data.anomalousUsers.map((u) => (
                                        <div
                                            key={u.userId}
                                            className="flex items-center justify-between text-sm border rounded px-3 py-2"
                                        >
                                            <span className="font-mono text-xs">{u.userId}</span>
                                            <Badge variant="danger">
                                                {u.ordersInOneHour} encomendas/hora
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </PageShell>
    );
}
