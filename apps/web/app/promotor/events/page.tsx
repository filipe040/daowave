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
    DRAFT: { label: "Rascunho", className: "bg-neutral-100 text-neutral-600 border-neutral-200" },
    ARCHIVED: { label: "Arquivado", className: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
    CANCELLED: { label: "Cancelado", className: "bg-red-500/10 text-red-400 border-red-500/20" },
};

const PAGE_SIZE = 10;

export default function PromoterEventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        const { data, error: apiErr } = await api.get<{ events?: Event[]; total?: number; pages?: number }>(
            `/api/promotor/events?page=${page}&limit=${PAGE_SIZE}`
        );
        if (apiErr) {
            setError(apiErr);
        } else {
            setEvents(data?.events ?? []);
            setTotal(data?.total ?? 0);
            setTotalPages(data?.pages ?? 1);
        }
        setLoading(false);
    }, [page]);

    useEffect(() => { load(); }, [load]);

    // Filter events based on search (local filtering for smoother UX, can be moved to API later)
    const filteredEvents = events.filter(e =>
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.city.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <PageShell
            title="Eventos"
            subtitle={total > 0 ? `Tens ${total} evento${total !== 1 ? 's' : ''} registados na tua organização.` : "Gere os teus eventos e monitoriza as vendas de bilhetes."}
            actions={
                <Link
                    href="/promotor/events/new"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-[14px] font-bold bg-violet-600 text-white hover:bg-violet-700 transition-all active:scale-95 shadow-md"
                >
                    <Plus className="w-4 h-4" />
                    Novo Evento
                </Link>
            }
        >
            <div className="space-y-8">
                {/* Filters/Search Bar */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full sm:max-w-md group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-neutral-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Pesquisar eventos por nome ou cidade..."
                            className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl py-3.5 pl-11 pr-4 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200 transition-all text-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <DataTable<Event>
                    keyField="id"
                    data={filteredEvents}
                    loading={loading}
                    error={error}
                    onRetry={load}
                    emptyIcon={Calendar}
                    emptyTitle="Nenhum evento encontrado"
                    emptyDescription="Ainda não criaste eventos ou não existem resultados para a tua pesquisa."
                    page={page}
                    totalPages={totalPages}
                    total={total}
                    onPageChange={setPage}
                    columns={[
                        {
                            key: "title",
                            label: "Evento",
                            render: (e) => (
                                <div className="flex items-center gap-4 py-1">
                                    <div className="w-12 h-12 rounded-xl bg-neutral-50 border border-neutral-200 flex flex-col items-center justify-center shrink-0">
                                        <span className="text-[9px] font-black text-neutral-400 uppercase leading-none">{format(new Date(e.startAt), "MMM", { locale: pt })}</span>
                                        <span className="text-base font-black text-neutral-900">{format(new Date(e.startAt), "dd")}</span>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-bold text-neutral-900 uppercase tracking-tight truncate group-hover:text-emerald-600 transition-colors">{e.title}</div>
                                        <div className="flex items-center gap-1.5 text-[12px] text-neutral-400 mt-0.5">
                                            <MapPin className="w-3 h-3" />
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
                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${config.className}`}>
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
                                    <Ticket className="w-4 h-4 text-neutral-400" />
                                    <span className="text-sm font-bold text-neutral-800">{e._count.tickets}</span>
                                </div>
                            ),
                        },
                        {
                            key: "orders",
                            label: "Vendas",
                            render: (e) => (
                                <div className="flex items-center gap-2">
                                    <ShoppingCart className="w-4 h-4 text-neutral-400" />
                                    <span className="text-sm font-bold text-neutral-800">{e._count.orders}</span>
                                </div>
                            ),
                        },
                    ]}
                    rowActions={(e) => (
                        <div className="flex items-center gap-2">
                            <Link
                                href={`/promotor/events/${e.id}`}
                                className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-all active:scale-90"
                                title="Editar Evento"
                            >
                                <Edit3 className="w-4 h-4" />
                            </Link>
                            <a
                                href={`/events/${e.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-all active:scale-90"
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
