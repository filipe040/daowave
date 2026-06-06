"use client";

import { useEffect, useState, useCallback } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { DataTable } from "@/components/dashboard/DataTable";
import { ShoppingCart, Download, Search, Eye } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

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

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
    PAID: { label: "Pago", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
    PENDING: { label: "Pendente", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
    CANCELED: { label: "Cancelado", className: "bg-red-500/10 text-red-400 border-red-500/20" },
    REFUNDED: { label: "Refunded", className: "bg-neutral-100 text-neutral-500 border-neutral-200" },
};

const fmt = (cents: number, currency = "EUR") =>
    new Intl.NumberFormat("pt-PT", { style: "currency", currency }).format(cents / 100);

const PAGE_SIZE = 15;

export default function PromoterSalesPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams({
            page: String(page),
            limit: String(PAGE_SIZE),
            status: statusFilter
        });

        const { data, error: apiErr } = await api.get<{ data: Order[]; total: number }>(
            `/api/promotor/sales?${params.toString()}`
        );

        if (apiErr) {
            setError(apiErr);
        } else {
            setOrders(data?.data ?? []);
            setTotal(data?.total ?? 0);
            setTotalPages(Math.ceil((data?.total ?? 0) / PAGE_SIZE));
        }
        setLoading(false);
    }, [page, statusFilter]);

    useEffect(() => { load(); }, [load]);

    const handleExport = () => {
        // Logic for CSV export would go here
        alert("A exportação de dados será implementada brevemente.");
    };

    return (
        <PageShell
            title="Vendas"
            subtitle={total > 0 ? `Tens ${total} encomenda${total !== 1 ? "s" : ""} registadas.` : "Histórico detalhado de faturamento e encomendas."}
            actions={
                <button
                    onClick={handleExport}
                    className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 sm:px-6 py-3 rounded-2xl text-[13px] sm:text-[14px] font-bold bg-violet-600 text-white hover:bg-violet-700 transition-all active:scale-95 shadow-md"
                >
                    <Download className="w-4 h-4 shrink-0" />
                    Exportar CSV
                </button>
            }
        >
            <div className="space-y-6 pb-8 sm:pb-12">
                {/* Search & Filters */}
                <div className="flex flex-col gap-4">
                    <div className="relative w-full sm:max-w-md group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-violet-600 transition-colors" />
                        <input
                            type="search"
                            placeholder="Pesquisar por comprador, email ou evento..."
                            className="w-full bg-white border border-neutral-200 rounded-2xl py-3.5 pl-11 pr-4 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400 transition-all text-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
                        {["ALL", "PAID", "PENDING", "CANCELED"].map((s) => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => { setStatusFilter(s); setPage(1); }}
                                className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${
                                    statusFilter === s
                                        ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                                        : "bg-white text-neutral-600 border-neutral-200 hover:border-violet-200"
                                }`}
                            >
                                {s === "ALL" ? "Todos" : s === "PAID" ? "Pagos" : s === "PENDING" ? "Pendentes" : "Cancelados"}
                            </button>
                        ))}
                    </div>
                </div>

                <DataTable<Order>
                    keyField="id"
                    data={orders.filter(o =>
                    (o.buyerName?.toLowerCase().includes(search.toLowerCase()) ||
                        o.buyerEmail?.toLowerCase().includes(search.toLowerCase()) ||
                        o.event.title.toLowerCase().includes(search.toLowerCase()))
                    )}
                    loading={loading}
                    error={error}
                    onRetry={load}
                    emptyIcon={ShoppingCart}
                    emptyTitle="Nenhuma venda encontrada"
                    emptyDescription="Ainda não tens encomendas registadas ou não existem resultados para os filtros selecionados."
                    page={page}
                    totalPages={totalPages}
                    total={total}
                    onPageChange={setPage}
                    mobileCard={(o) => {
                        const config = STATUS_CONFIG[o.status] || STATUS_CONFIG.PENDING;
                        return (
                            <div className="space-y-3">
                                <div className="flex items-start justify-between gap-3 min-w-0">
                                    <div className="min-w-0 flex-1">
                                        <div className="font-bold text-neutral-900 tracking-tight break-words">
                                            {o.buyerName || "Cliente"}
                                        </div>
                                        {o.buyerEmail && (
                                            <div className="text-[12px] text-neutral-400 truncate mt-0.5">{o.buyerEmail}</div>
                                        )}
                                    </div>
                                    <span className="font-black text-neutral-900 shrink-0 tabular-nums">
                                        {fmt(o.totalCents, o.currency)}
                                    </span>
                                </div>
                                <div className="text-[13px] font-medium text-neutral-600 break-words">{o.event.title}</div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${config.className}`}>
                                        {config.label}
                                    </span>
                                    <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">
                                        {o._count.tickets} bilhete{o._count.tickets !== 1 ? "s" : ""}
                                    </span>
                                    <span className="text-[11px] text-neutral-400 tabular-nums">
                                        {format(new Date(o.createdAt), "dd/MM/yyyy HH:mm", { locale: pt })}
                                    </span>
                                </div>
                                <Link
                                    href={`/promotor/sales/${o.id}`}
                                    className="flex w-full items-center justify-center gap-2 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-700 text-[12px] font-bold hover:bg-neutral-100 transition-all"
                                >
                                    <Eye className="w-3.5 h-3.5" />
                                    Ver detalhes
                                </Link>
                            </div>
                        );
                    }}
                    columns={[
                        {
                            key: "buyerName",
                            label: "Comprador",
                            render: (o) => (
                                <div className="min-w-0 py-1">
                                    <div className="font-bold text-neutral-900 uppercase tracking-tight truncate">{o.buyerName || "Cliente"}</div>
                                    <div className="text-[12px] text-neutral-400 truncate">{o.buyerEmail || ""}</div>
                                </div>
                            ),
                        },
                        {
                            key: "event",
                            label: "Evento / Bilhetes",
                            render: (o) => (
                                <div className="min-w-0">
                                    <div className="text-[13px] font-medium text-neutral-600 truncate">{o.event.title}</div>
                                    <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">
                                        {o._count.tickets} BILHETE{o._count.tickets !== 1 ? "S" : ""}
                                    </div>
                                </div>
                            ),
                        },
                        {
                            key: "totalCents",
                            label: "Total",
                            render: (o) => (
                                <span className="font-black text-neutral-900">{fmt(o.totalCents, o.currency)}</span>
                            ),
                        },
                        {
                            key: "status",
                            label: "Estado",
                            render: (o) => {
                                const config = STATUS_CONFIG[o.status] || STATUS_CONFIG.PENDING;
                                return (
                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${config.className}`}>
                                        {config.label}
                                    </span>
                                );
                            },
                        },
                        {
                            key: "createdAt",
                            label: "Data",
                            render: (o) => (
                                <div className="text-[12px] font-medium text-neutral-500 tabular-nums">
                                    {format(new Date(o.createdAt), "dd/MM/yyyy HH:mm", { locale: pt })}
                                </div>
                            ),
                        },
                    ]}
                    rowActions={(o) => (
                        <Link
                            href={`/promotor/sales/${o.id}`}
                            className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-all active:scale-90"
                            title="Ver Detalhes"
                        >
                            <Eye className="w-4 h-4" />
                        </Link>
                    )}
                />
            </div>
        </PageShell>
    );
}
