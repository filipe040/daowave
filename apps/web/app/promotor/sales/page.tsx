"use client";

import { useEffect, useState, useCallback } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
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

const STATUS_COLOR: Record<OrderStatus, string> = {
    PAID: "bg-emerald-50 text-emerald-700",
    PENDING: "bg-amber-50 text-amber-700",
    CANCELED: "bg-red-50 text-red-600",
    REFUNDED: "bg-gray-100 text-gray-500",
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

    const filterSelect = (
        <select
            className="text-sm border border-gray-200 bg-white text-gray-700 rounded-xl px-3 h-9 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        >
            <option value="ALL">Todos os estados</option>
            <option value="PAID">Pagos</option>
            <option value="PENDING">Pendentes</option>
            <option value="CANCELED">Cancelados</option>
            <option value="REFUNDED">Reembolsados</option>
        </select>
    );

    return (
        <PageShell
            title="Vendas"
            subtitle={total > 0 ? `${total} encomenda${total !== 1 ? "s" : ""}` : "Histórico de encomendas"}
            actions={filterSelect}
        >
            {loading && (
                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="px-6 py-4 border-b border-gray-100 last:border-0">
                            <Skeleton className="h-5 w-3/4" />
                        </div>
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
                    <div className="hidden md:block bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    {["Comprador", "Evento", "Bilhetes", "Total", "Estado", "Data"].map((h) => (
                                        <th key={h} className="px-6 py-3.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {data.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{order.buyerName ?? "—"}</div>
                                            <div className="text-xs text-gray-400">{order.buyerEmail ?? ""}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 max-w-[200px] truncate">{order.event.title}</td>
                                        <td className="px-6 py-4 text-gray-600 text-center">{order._count.tickets}</td>
                                        <td className="px-6 py-4 font-semibold text-gray-900 whitespace-nowrap">{fmt(order.totalCents, order.currency)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_COLOR[order.status]}`}>
                                                {STATUS_LABELS[order.status]}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-400 whitespace-nowrap">
                                            {new Date(order.createdAt).toLocaleDateString("pt-PT")}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="md:hidden space-y-3">
                        {data.map((order) => (
                            <div key={order.id} className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <div className="font-medium text-gray-900 truncate">{order.buyerName ?? "—"}</div>
                                        <div className="text-xs text-gray-400 truncate">{order.buyerEmail ?? ""}</div>
                                    </div>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium shrink-0 ${STATUS_COLOR[order.status]}`}>
                                        {STATUS_LABELS[order.status]}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 truncate">{order.event.title}</p>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400">{order._count.tickets} bilhete{order._count.tickets !== 1 ? "s" : ""}</span>
                                    <span className="font-semibold text-gray-900">{fmt(order.totalCents, order.currency)}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-400">Página {page} de {totalPages} · {total} total</p>
                        <div className="flex items-center gap-1">
                            <button
                                disabled={page <= 1}
                                onClick={() => setPage((p) => p - 1)}
                                className="p-2 rounded-lg text-gray-400 hover:bg-white hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-gray-200/80"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => p + 1)}
                                className="p-2 rounded-lg text-gray-400 hover:bg-white hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-gray-200/80"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PageShell>
    );
}
