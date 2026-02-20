"use client";

import { useEffect, useState, useCallback } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    DRAFT: "Rascunho",
    PUBLISHED: "Publicado",
    CANCELLED: "Cancelado",
    ENDED: "Terminado",
};

const STATUS_VARIANTS: Record<EventStatus, "default" | "success" | "warning" | "danger" | "muted"> = {
    PUBLISHED: "success",
    DRAFT: "warning",
    CANCELLED: "danger",
    ENDED: "muted",
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
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ page: String(page), limit: String(PAGE_LIMIT) });
            if (status !== "ALL") params.set("status", status);
            const res = await fetchWithTimeout(`/api/admin/events?${params}`);
            if (!res.ok) throw new Error(`Erro ${res.status}`);
            const json = await res.json() as { data: AdminEvent[]; total: number };
            setData(json.data);
            setTotal(json.total);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Erro desconhecido");
        } finally {
            setLoading(false);
        }
    }, [page, status]);

    useEffect(() => { load(); }, [load]);

    const handleApprove = async (id: string) => {
        setActioning(id);
        try {
            const res = await fetchWithTimeout(`/api/admin/events/${id}/approve`, { method: "PATCH" });
            if (!res.ok) throw new Error(`Erro ${res.status}`);
            toast.success("Evento publicado");
            await load();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Erro ao publicar");
        } finally {
            setActioning(null);
        }
    };

    const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

    const filtered = search
        ? data.filter(
            (e) =>
                e.title.toLowerCase().includes(search.toLowerCase()) ||
                e.promoter.brandName.toLowerCase().includes(search.toLowerCase())
        )
        : data;

    return (
        <PageShell
            title="Eventos"
            subtitle={`${total} evento${total !== 1 ? "s" : ""} no total`}
            actions={
                <div className="flex flex-wrap gap-2">
                    <input
                        className="text-sm border border-zinc-700 bg-zinc-900 text-white rounded-md px-3 h-9 w-40 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        placeholder="Pesquisar…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <select
                        className="text-sm border border-zinc-700 bg-zinc-900 text-white rounded-md px-3 h-9 min-w-[9rem]"
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
                <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-xl" />
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
                    <div className="hidden md:block rounded-xl border border-zinc-700/60 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm min-w-[640px]">
                                <thead className="bg-zinc-800/70">
                                    <tr>
                                        {["Evento", "Organizador", "Data", "Bilhetes", "Estado", "Ações"].map((h) => (
                                            <th key={h} className="p-3 text-left font-medium text-zinc-400 whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((ev, i) => (
                                        <tr key={ev.id} className={i % 2 === 0 ? "bg-zinc-900/60" : "bg-zinc-800/30"}>
                                            <td className="p-3">
                                                <div className="font-medium text-white max-w-[200px] truncate">{ev.title}</div>
                                                <div className="text-xs text-zinc-400">{ev.city}</div>
                                            </td>
                                            <td className="p-3">
                                                <div className="text-zinc-300">{ev.promoter.brandName}</div>
                                                <div className="text-xs text-zinc-400">{ev.promoter.user.email}</div>
                                            </td>
                                            <td className="p-3 text-xs text-zinc-300 whitespace-nowrap">
                                                {new Date(ev.startAt).toLocaleDateString("pt-PT")}
                                            </td>
                                            <td className="p-3 text-zinc-300 text-center">{ev._count.tickets}</td>
                                            <td className="p-3">
                                                <Badge variant={STATUS_VARIANTS[ev.status]}>{STATUS_LABELS[ev.status]}</Badge>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    {ev.status === "DRAFT" && (
                                                        <Button size="sm" variant="outline" disabled={actioning === ev.id} onClick={() => handleApprove(ev.id)}>
                                                            {actioning === ev.id ? "…" : "Publicar"}
                                                        </Button>
                                                    )}
                                                    <a
                                                        href={`/events/${ev.slug}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                                                    >
                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                    </a>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile cards */}
                    <div className="md:hidden space-y-3">
                        {filtered.map((ev) => (
                            <div key={ev.id} className="rounded-xl border border-zinc-700/60 bg-zinc-900/60 p-4 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <div className="font-medium text-white truncate">{ev.title}</div>
                                        <div className="text-xs text-zinc-400">{ev.city}</div>
                                    </div>
                                    <Badge variant={STATUS_VARIANTS[ev.status]}>{STATUS_LABELS[ev.status]}</Badge>
                                </div>
                                <div className="text-xs text-zinc-400">{ev.promoter.brandName} · {ev.promoter.user.email}</div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-zinc-400">{new Date(ev.startAt).toLocaleDateString("pt-PT")} · {ev._count.tickets} bilhetes</span>
                                    <div className="flex gap-2">
                                        {ev.status === "DRAFT" && (
                                            <Button size="sm" variant="outline" disabled={actioning === ev.id} onClick={() => handleApprove(ev.id)}>
                                                Publicar
                                            </Button>
                                        )}
                                        <a href={`/events/${ev.slug}`} target="_blank" rel="noopener noreferrer"
                                            className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors">
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

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
