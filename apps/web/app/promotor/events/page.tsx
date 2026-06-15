"use client";

import { useEffect, useState, useCallback } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { DataTable } from "@/components/dashboard/DataTable";
import { Calendar, Plus, ExternalLink, Edit3, MapPin, Ticket, ShoppingCart, Search } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface Event {
    id: string;
    title: string;
    slug: string;
    startAt: string;
    venue: string;
    city: string;
    status: string;
    _count: { tickets: number; orders: number };
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    PUBLISHED: { label: "Ativo", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
    DRAFT: { label: "Rascunho", className: "bg-neutral-100 text-zinc-400 border-white/10" },
    ARCHIVED: { label: "Arquivado", className: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
    CANCELLED: { label: "Cancelado", className: "bg-red-500/10 text-red-400 border-red-500/20" },
};

const STATUS_FILTERS = [
    { id: "ALL", label: "Todos" },
    { id: "PUBLISHED", label: "Ativos" },
    { id: "DRAFT", label: "Rascunhos" },
    { id: "ARCHIVED", label: "Arquivados" },
    { id: "CANCELLED", label: "Cancelados" },
] as const;

const PAGE_SIZE = 10;

export default function PromoterEventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams({
            page: String(page),
            limit: String(PAGE_SIZE),
        });
        if (search.trim()) params.set("search", search.trim());
        if (statusFilter !== "ALL") params.set("status", statusFilter);

        const { data, error: apiErr } = await api.get<{ events?: Event[]; total?: number; pages?: number }>(
            `/api/promotor/events?${params.toString()}`
        );
        if (apiErr) {
            setError(apiErr);
        } else {
            setEvents(data?.events ?? []);
            setTotal(data?.total ?? 0);
            setTotalPages(data?.pages ?? 1);
        }
        setLoading(false);
    }, [page, search, statusFilter]);

    useEffect(() => {
        load();
    }, [load]);

    // Debounce pesquisa
    useEffect(() => {
        const t = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 350);
        return () => clearTimeout(t);
    }, [searchInput]);

    return (
        <PageShell
            title="Eventos"
            subtitle={
                total > 0
                    ? `${total} evento${total !== 1 ? "s" : ""} encontrado${total !== 1 ? "s" : ""}`
                    : "Gere os teus eventos e monitoriza as vendas de bilhetes."
            }
            actions={
                <Link
                    href="/promotor/events/new"
                    className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 sm:px-6 py-3 rounded-2xl text-[13px] sm:text-[14px] font-bold bg-[#00a0e3] text-white hover:bg-[#0090cc] transition-all active:scale-95 shadow-md"
                >
                    <Plus className="w-4 h-4 shrink-0" />
                    Novo Evento
                </Link>
            }
        >
            <div className="space-y-6">
                <div className="flex flex-col gap-4">
                    <div className="relative w-full sm:max-w-md group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-[#00a0e3] transition-colors" />
                        <input
                            type="search"
                            placeholder="Pesquisar por nome, cidade ou local..."
                            className="w-full bg-[#0c0c12] border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#00a0e3]/20 focus:border-[#00a0e3]/50 transition-all text-sm"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {STATUS_FILTERS.map(({ id, label }) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => {
                                    setStatusFilter(id);
                                    setPage(1);
                                }}
                                className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                                    statusFilter === id
                                        ? "bg-[#00a0e3] text-white border-[#00a0e3] shadow-sm"
                                        : "bg-[#14141f] text-zinc-400 border-white/10 hover:border-[#00a0e3]/30"
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <DataTable<Event>
                    keyField="id"
                    data={events}
                    loading={loading}
                    error={error}
                    onRetry={load}
                    emptyIcon={Calendar}
                    emptyTitle="Nenhum evento encontrado"
                    emptyDescription={
                        search || statusFilter !== "ALL"
                            ? "Não existem eventos com estes filtros. Tenta ajustar a pesquisa ou o estado."
                            : "Ainda não criaste eventos. Começa por criar o primeiro."
                    }
                    page={page}
                    totalPages={totalPages}
                    total={total}
                    onPageChange={setPage}
                    mobileCard={(e) => {
                        const config = STATUS_CONFIG[e.status] ?? STATUS_CONFIG.DRAFT;
                        return (
                            <div className="space-y-4">
                                <div className="flex items-start gap-3 min-w-0">
                                    <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center shrink-0">
                                        <span className="text-[8px] font-black text-zinc-500 uppercase leading-none">
                                            {format(new Date(e.startAt), "MMM", { locale: pt })}
                                        </span>
                                        <span className="text-sm font-black text-white">
                                            {format(new Date(e.startAt), "dd")}
                                        </span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="font-bold text-white tracking-tight leading-snug break-words">
                                            {e.title}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[12px] text-zinc-500 mt-1">
                                            <MapPin className="w-3 h-3 shrink-0" />
                                            <span className="truncate">{e.venue ? `${e.venue}, ` : ""}{e.city}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${config.className}`}>
                                        {config.label}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/5 border border-white/10 text-zinc-400">
                                        <Ticket className="w-3 h-3" />
                                        {e._count.tickets}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/5 border border-white/10 text-zinc-400">
                                        <ShoppingCart className="w-3 h-3" />
                                        {e._count.orders}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 pt-1 border-t border-white/10">
                                    <Link
                                        href={`/promotor/events/${e.id}`}
                                        className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#00a0e3] text-white text-[12px] font-bold hover:bg-[#0090cc] transition-all"
                                    >
                                        <Edit3 className="w-3.5 h-3.5" />
                                        Editar
                                    </Link>
                                    <a
                                        href={`/events/${e.slug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-500 hover:text-white hover:bg-white/10 transition-all"
                                        title="Ver página pública"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                            </div>
                        );
                    }}
                    columns={[
                        {
                            key: "title",
                            label: "Evento",
                            render: (e) => (
                                <div className="flex items-center gap-4 py-1">
                                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center shrink-0">
                                        <span className="text-[9px] font-black text-zinc-500 uppercase leading-none">
                                            {format(new Date(e.startAt), "MMM", { locale: pt })}
                                        </span>
                                        <span className="text-base font-black text-white">
                                            {format(new Date(e.startAt), "dd")}
                                        </span>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-bold text-white tracking-tight truncate group-hover:text-emerald-600 transition-colors">
                                            {e.title}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[12px] text-zinc-500 mt-0.5">
                                            <MapPin className="w-3 h-3 shrink-0" />
                                            <span className="truncate">{e.city}</span>
                                        </div>
                                    </div>
                                </div>
                            ),
                        },
                        {
                            key: "status",
                            label: "Estado",
                            render: (e) => {
                                const config = STATUS_CONFIG[e.status] ?? STATUS_CONFIG.DRAFT;
                                return (
                                    <span
                                        className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${config.className}`}
                                    >
                                        {config.label}
                                    </span>
                                );
                            },
                        },
                        {
                            key: "tickets",
                            label: "Bilhetes",
                            render: (e) => (
                                <div className="flex items-center gap-2">
                                    <Ticket className="w-4 h-4 text-zinc-500" />
                                    <span className="text-sm font-bold text-zinc-200">{e._count.tickets}</span>
                                </div>
                            ),
                        },
                        {
                            key: "orders",
                            label: "Vendas",
                            render: (e) => (
                                <div className="flex items-center gap-2">
                                    <ShoppingCart className="w-4 h-4 text-zinc-500" />
                                    <span className="text-sm font-bold text-zinc-200">{e._count.orders}</span>
                                </div>
                            ),
                        },
                    ]}
                    rowActions={(e) => (
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <Link
                                href={`/promotor/events/${e.id}`}
                                className="p-2.5 sm:p-3 rounded-xl bg-white/5 border border-white/10 text-zinc-500 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                                title="Editar Evento"
                            >
                                <Edit3 className="w-4 h-4" />
                            </Link>
                            <a
                                href={`/events/${e.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2.5 sm:p-3 rounded-xl bg-white/5 border border-white/10 text-zinc-500 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                                title="Ver Página Pública"
                            >
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        </div>
                    )}
                />
            </div>
        </PageShell>
    );
}
