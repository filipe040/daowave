"use client";

import { useEffect, useState, useCallback } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

type OrderStatus = "PENDING" | "PAID" | "CANCELED" | "REFUNDED";

interface Order {
    id: string;
    status: OrderStatus;
    totalCents: number;
    currency: string;
    buyerName: string | null;
    buyerEmail: string | null;
    createdAt: string;
    event: { id: string; title: string; slug: string };
    _count: { tickets: number };
}

interface ApiResponse {
    data: Order[];
    total: number;
    page: number;
    limit: number;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
    PENDING: "Pendente",
    PAID: "Pago",
    CANCELED: "Cancelado",
    REFUNDED: "Reembolsado",
};

const STATUS_VARIANTS: Record<OrderStatus, "default" | "success" | "danger" | "warning" | "muted"> = {
    PAID: "success",
    PENDING: "warning",
    CANCELED: "danger",
    REFUNDED: "muted",
};

const fmt = (cents: number, currency = "EUR") =>
    new Intl.NumberFormat("pt-PT", { style: "currency", currency }).format(cents / 100);

const PAGE_LIMIT = 20;

export default function PromoterSalesPage() {
    const [data, setData] = useState<Order[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState("ALL");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ page: String(page), limit: String(PAGE_LIMIT) });
            if (status !== "ALL") params.set("status", status);
            const res = await fetchWithTimeout(`/api/promotor/sales?${params}`);
            if (!res.ok) throw new Error(`Erro ${res.status}`);
            const json: ApiResponse = await res.json();
            setData(json.data);
            setTotal(json.total);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Erro desconhecido");
        } finally {
            setLoading(false);
        }
    }, [page, status]);

    useEffect(() => { load(); }, [load]);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

    return (
        <PageShell
            title="Vendas"
            subtitle={`${total} encomenda${total !== 1 ? "s" : ""}`}
            actions={
                <select
                    className="text-sm border border-zinc-700 bg-zinc-900 text-white rounded-md px-3 h-9 min-w-[9rem]"
                    value={status}
                    onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                >
                    <option value="ALL">Todos os estados</option>
                    <option value="PAID">Pagos</option>
                    <option value="PENDING">Pendentes</option>
                    <option value="CANCELED">Cancelados</option>
                    <option value="REFUNDED">Reembolsados</option>
                </select>
            }
        >
            {loading && (
                <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-lg" />
                    ))}
                </div>
            )}

            {!loading && error && <ErrorState message={error} onRetry={load} />}

            {!loading && !error && data.length === 0 && (
                <EmptyState
                    icon={ShoppingCart}
                    title="Sem vendas"
                    description="Ainda não há encomendas para os seus eventos."
                />
            )}

            {!loading && !error && data.length > 0 && (
                <div className="space-y-4">
                    {/* Desktop table */}
                    <div className="hidden md:block rounded-xl border border-zinc-700/60 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm min-w-[640px]">
                                <thead className="bg-zinc-800/70">
                                    <tr>
                                        {["ID", "Comprador", "Evento", "Bilhetes", "Total", "Estado", "Data"].map((h) => (
                                            <th key={h} className="p-3 text-left font-medium text-zinc-400 whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((order, i) => (
                                        <tr key={order.id} className={i % 2 === 0 ? "bg-zinc-900/60" : "bg-zinc-800/30"}>
                                            <td className="p-3 font-mono text-xs text-zinc-500">{order.id.slice(0, 8)}…</td>
                                            <td className="p-3">
                                                <div className="font-medium text-white">{order.buyerName ?? "—"}</div>
                                                <div className="text-xs text-zinc-400">{order.buyerEmail ?? ""}</div>
                                            </td>
                                            <td className="p-3 text-zinc-300 max-w-[180px] truncate">{order.event.title}</td>
                                            <td className="p-3 text-zinc-300 text-center">{order._count.tickets}</td>
                                            <td className="p-3 font-semibold text-white whitespace-nowrap">{fmt(order.totalCents, order.currency)}</td>
                                            <td className="p-3"><Badge variant={STATUS_VARIANTS[order.status]}>{STATUS_LABELS[order.status]}</Badge></td>
                                            <td className="p-3 text-xs text-zinc-400 whitespace-nowrap">{new Date(order.createdAt).toLocaleDateString("pt-PT")}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile cards */}
                    <div className="md:hidden space-y-3">
                        {data.map((order) => (
                            <div key={order.id} className="rounded-xl border border-zinc-700/60 bg-zinc-900/60 p-4 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <div className="font-medium text-white truncate">{order.buyerName ?? "—"}</div>
                                        <div className="text-xs text-zinc-400 truncate">{order.buyerEmail ?? ""}</div>
                                    </div>
                                    <Badge variant={STATUS_VARIANTS[order.status]}>{STATUS_LABELS[order.status]}</Badge>
                                </div>
                                <div className="text-sm text-zinc-300 truncate">{order.event.title}</div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-zinc-400">{order._count.tickets} bilhete{order._count.tickets !== 1 ? "s" : ""}</span>
                                    <span className="font-semibold text-white">{fmt(order.totalCents, order.currency)}</span>
                                </div>
                                <div className="text-xs text-zinc-500">{new Date(order.createdAt).toLocaleDateString("pt-PT")}</div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-zinc-400">Página {page} de {totalPages} · {total} total</p>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </PageShell>
    );
}
