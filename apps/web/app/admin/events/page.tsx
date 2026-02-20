"use client";

import { useEffect, useState, useCallback } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

type EventStatus = "DRAFT" | "PUBLISHED" | "CANCELLED" | "ENDED";

interface AdminEvent {
    id: string;
    title: string;
    slug: string;
    city: string;
    status: EventStatus;
    startAt: string;
    createdAt: string;
    promoter: {
        id: string;
        brandName: string;
        user: { email: string };
    };
    _count: { tickets: number; orders: number };
}

interface ApiResponse {
    data: AdminEvent[];
    total: number;
    page: number;
    limit: number;
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
    const [status, setStatus] = useState<string>("ALL");
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
            const json: ApiResponse = await res.json();
            setData(json.data);
            setTotal(json.total);
        } catch (err: any) {
            setError(err.message ?? "Erro desconhecido");
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
            await load();
        } catch (err: any) {
            alert(`Erro: ${err.message}`);
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
                <div className="flex gap-2">
                    <input
                        className="text-sm border border-zinc-700 bg-zinc-900 text-white rounded-md px-3 py-2 w-44 placeholder:text-zinc-500"
                        placeholder="Pesquisar…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <select
                        className="text-sm border border-zinc-700 bg-zinc-900 text-white rounded-md px-3 py-2"
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
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-14 w-full rounded-lg" />
                    ))}
                </div>
            )}

            {!loading && error && <ErrorState message={error} onRetry={load} />}

            {!loading && !error && filtered.length === 0 && (
                <EmptyState icon={Calendar} title="Sem eventos" description="Nenhum evento encontrado." />
            )}

            {!loading && !error && filtered.length > 0 && (
                <>
                    <div className="rounded-md border border-zinc-700 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-zinc-800">
                                <tr>
                                    <th className="p-3 text-left font-medium text-zinc-400">Evento</th>
                                    <th className="p-3 text-left font-medium text-zinc-400">Organizador</th>
                                    <th className="p-3 text-left font-medium text-zinc-400">Data</th>
                                    <th className="p-3 text-left font-medium text-zinc-400">Bilhetes</th>
                                    <th className="p-3 text-left font-medium text-zinc-400">Estado</th>
                                    <th className="p-3 text-left font-medium text-zinc-400">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((ev, i) => (
                                    <tr key={ev.id} className={i % 2 === 0 ? "bg-zinc-900" : "bg-zinc-800/40"}>
                                        <td className="p-3">
                                            <div className="font-medium text-white">{ev.title}</div>
                                            <div className="text-xs text-zinc-400">{ev.city}</div>
                                        </td>
                                        <td className="p-3">
                                            <div className="text-zinc-300">{ev.promoter.brandName}</div>
                                            <div className="text-xs text-zinc-400">{ev.promoter.user.email}</div>
                                        </td>
                                        <td className="p-3 text-xs text-zinc-300">
                                            {new Date(ev.startAt).toLocaleDateString("pt-PT")}
                                        </td>
                                        <td className="p-3 text-zinc-300">{ev._count.tickets}</td>
                                        <td className="p-3">
                                            <Badge variant={STATUS_VARIANTS[ev.status]}>{STATUS_LABELS[ev.status]}</Badge>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex gap-2">
                                                {ev.status === "DRAFT" && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        disabled={actioning === ev.id}
                                                        onClick={() => handleApprove(ev.id)}
                                                    >
                                                        {actioning === ev.id ? "…" : "Publicar"}
                                                    </Button>
                                                )}
                                                <a
                                                    href={`/events/${ev.slug}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-zinc-400 hover:text-white underline underline-offset-2 self-center"
                                                >
                                                    Ver
                                                </a>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <p className="text-sm text-zinc-400">Página {page} de {totalPages}</p>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </PageShell>
    );
}
