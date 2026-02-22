"use client";

import { useEffect, useState, useCallback } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { toast } from "sonner";

type EventStatus = "DRAFT" | "PUBLISHED" | "CANCELLED" | "ENDED";

interface AdminEvent {
    id: string;
    title: string;
    slug: string;
    city: string;
    status: EventStatus;
    startAt: string;
    promoter: { id: string; brandName: string; user: { email: string } };
    _count: { tickets: number; orders: number };
}

const STATUS_LABELS: Record<EventStatus, string> = {
    DRAFT: "Rascunho", PUBLISHED: "Publicado", CANCELLED: "Cancelado", ENDED: "Terminado",
};
const STATUS_COLOR: Record<EventStatus, string> = {
    PUBLISHED: "bg-emerald-50 text-emerald-700",
    DRAFT: "bg-amber-50 text-amber-700",
    CANCELLED: "bg-red-50 text-red-600",
    ENDED: "bg-gray-100 text-gray-500",
};

const PAGE_LIMIT = 20;

export default function AdminEventsPage() {
    const [data, setData] = useState<AdminEvent[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState("ALL");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actioning, setActioning] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const params = new URLSearchParams({ page: String(page), limit: String(PAGE_LIMIT) });
            if (status !== "ALL") params.set("status", status);
            const res = await fetchWithTimeout(`/api/admin/events?${params}`);
            if (!res.ok) throw new Error(`Erro ${res.status}`);
            const json = await res.json() as { data: AdminEvent[]; total: number };
            setData(json.data); setTotal(json.total);
        } catch (err: unknown) { setError(err instanceof Error ? err.message : "Erro"); }
        finally { setLoading(false); }
    }, [page, status]);

    useEffect(() => { load(); }, [load]);

    const handleApprove = async (id: string) => {
        setActioning(id);
        try {
            const res = await fetchWithTimeout(`/api/admin/events/${id}/approve`, { method: "POST" });
            if (!res.ok) throw new Error(`Erro ${res.status}`);
            toast.success("Evento publicado");
            await load();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Erro");
        } finally {
            setActioning(null);
        }
    };

    const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));
    const filtered = search
        ? data.filter((e) =>
            e.title.toLowerCase().includes(search.toLowerCase()) ||
            e.promoter.brandName.toLowerCase().includes(search.toLowerCase()))
        : data;

    return (
        <PageShell
            title="Eventos"
            subtitle={`${total} evento${total !== 1 ? "s" : ""}`}
            actions={
                <div className="flex flex-wrap gap-2">
                    <input
                        className="text-sm border border-gray-200 bg-white text-gray-700 rounded-xl px-3 h-9 w-40 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                        placeholder="Pesquisar…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <select
                        className="text-sm border border-gray-200 bg-white text-gray-700 rounded-xl px-3 h-9 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                        value={status}
                        onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                    >
                        <option value="ALL">Todos</option>
                        <option value="DRAFT">Rascunho</option>
                        <option value="PUBLISHED">Publicado</option>
                        <option value="CANCELLED">Cancelado</option>
                        <option value="ENDED">Terminado</option>
                    </select>
                </div>
            }
        >
            {loading && (
                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="px-6 py-4 border-b border-gray-50 last:border-0">
                            <Skeleton className="h-5 w-3/4" />
                        </div>
                    ))}
                </div>
            )}
            {!loading && error && <ErrorState message={error} onRetry={load} />}
            {!loading && !error && filtered.length === 0 && (
                <EmptyState icon={Calendar} title="Sem eventos" description="Nenhum evento encontrado." />
            )}
            {!loading && !error && filtered.length > 0 && (
                <div className="space-y-4">
                    {/* Desktop */}
                    <div className="hidden md:block bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    {["Evento", "Organizador", "Data", "Bilhetes", "Estado", ""].map((h) => (
                                        <th key={h} className="px-6 py-3.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map((ev) => (
                                    <tr key={ev.id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900 max-w-[200px] truncate">{ev.title}</div>
                                            <div className="text-xs text-gray-400">{ev.city}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-gray-700">{ev.promoter.brandName}</div>
                                            <div className="text-xs text-gray-400">{ev.promoter.user.email}</div>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                                            {new Date(ev.startAt).toLocaleDateString("pt-PT")}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 text-center">{ev._count.tickets}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_COLOR[ev.status]}`}>
                                                {STATUS_LABELS[ev.status]}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 justify-end">
                                                {ev.status === "DRAFT" && (
                                                    <button
                                                        disabled={actioning === ev.id}
                                                        onClick={() => handleApprove(ev.id)}
                                                        className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                                                    >
                                                        {actioning === ev.id ? "…" : "Publicar"}
                                                    </button>
                                                )}
                                                <a href={`/events/${ev.slug}`} target="_blank" rel="noopener noreferrer"
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                </a>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="md:hidden space-y-3">
                        {filtered.map((ev) => (
                            <div key={ev.id} className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <div className="font-medium text-gray-900 truncate">{ev.title}</div>
                                        <div className="text-xs text-gray-400">{ev.city}</div>
                                    </div>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium shrink-0 ${STATUS_COLOR[ev.status]}`}>
                                        {STATUS_LABELS[ev.status]}
                                    </span>
                                </div>
                                <div className="text-xs text-gray-400">{ev.promoter.brandName}</div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-400">
                                        {new Date(ev.startAt).toLocaleDateString("pt-PT")} · {ev._count.tickets} bilhetes
                                    </span>
                                    <div className="flex gap-2">
                                        {ev.status === "DRAFT" && (
                                            <button disabled={actioning === ev.id} onClick={() => handleApprove(ev.id)}
                                                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                                                Publicar
                                            </button>
                                        )}
                                        <a href={`/events/${ev.slug}`} target="_blank" rel="noopener noreferrer"
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-400">Página {page} de {totalPages} · {total} total</p>
                        <div className="flex items-center gap-1">
                            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                                className="p-2 rounded-lg text-gray-400 hover:bg-white hover:text-gray-700 disabled:opacity-30 border border-gray-200/80 transition-colors">
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
                                className="p-2 rounded-lg text-gray-400 hover:bg-white hover:text-gray-700 disabled:opacity-30 border border-gray-200/80 transition-colors">
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PageShell>
    );
}
