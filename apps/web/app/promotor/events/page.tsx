"use client";

import { useEffect, useState, useCallback } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { DataTable } from "@/components/dashboard/DataTable";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { Calendar, Plus, ExternalLink, Building2, Pencil } from "lucide-react";
import Link from "next/link";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

interface Org { id: string; name: string; role: string }
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

const STATUS_COLOR: Record<string, string> = {
    PUBLISHED: "bg-emerald-50 text-emerald-700 ring-emerald-200/60",
    DRAFT: "bg-amber-50 text-amber-700 ring-amber-200/60",
    ARCHIVED: "bg-gray-100 text-gray-500 ring-gray-200/60",
    CANCELLED: "bg-red-50 text-red-600 ring-red-200/60",
};
const STATUS_LABEL: Record<string, string> = {
    PUBLISHED: "Publicado",
    DRAFT: "Rascunho",
    ARCHIVED: "Arquivado",
    CANCELLED: "Cancelado",
};

const PAGE_SIZE = 20;

export default function PromoterEventsPage() {
    const [orgs, setOrgs] = useState<Org[]>([]);
    const [orgId, setOrgId] = useState("");
    const [events, setEvents] = useState<Event[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [loadingOrgs, setLoadingOrgs] = useState(true);
    const [loadingEvents, setLoadingEvents] = useState(false);
    const [orgError, setOrgError] = useState<string | null>(null);
    const [eventError, setEventError] = useState<string | null>(null);

    const loadOrgs = useCallback(async () => {
        setLoadingOrgs(true); setOrgError(null);
        try {
            const res = await fetchWithTimeout("/api/promotor/organizations");
            if (!res.ok) throw new Error(`Erro ${res.status}`);
            const json = await res.json() as { data: Org[] };
            const data = json.data ?? [];
            setOrgs(data);
            if (data.length === 1) setOrgId(data[0].id);
        } catch (err: unknown) { setOrgError(err instanceof Error ? err.message : "Erro"); }
        finally { setLoadingOrgs(false); }
    }, []);

    const loadEvents = useCallback(async () => {
        if (!orgId) return;
        setLoadingEvents(true); setEventError(null);
        try {
            const res = await fetchWithTimeout(`/api/promotor/events?orgId=${orgId}&page=${page}&limit=${PAGE_SIZE}`);
            if (!res.ok) throw new Error(`Erro ${res.status}`);
            const json = await res.json() as { events?: Event[]; total?: number; pages?: number };
            setEvents(json.events ?? []);
            setTotal(json.total ?? 0);
            setTotalPages(Math.max(1, json.pages ?? 1));
        } catch (err: unknown) { setEventError(err instanceof Error ? err.message : "Erro"); }
        finally { setLoadingEvents(false); }
    }, [orgId, page]);

    useEffect(() => { loadOrgs(); }, [loadOrgs]);
    useEffect(() => {
        if (orgId) {
            setPage(1);
            setEvents([]);
        }
    }, [orgId]);
    useEffect(() => { if (orgId) loadEvents(); }, [orgId, page, loadEvents]);

    const subtitle = total > 0
        ? `${total} evento${total !== 1 ? "s" : ""}`
        : "Gerir os seus eventos";

    const createBtn = orgId ? (
        <Link
            href={`/promotor/events/new?orgId=${orgId}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 transition-colors"
        >
            <Plus className="h-4 w-4" />
            Novo evento
        </Link>
    ) : null;

    if (!loadingOrgs && orgError) return <PageShell title="Eventos"><ErrorState message={orgError} onRetry={loadOrgs} /></PageShell>;

    if (!loadingOrgs && orgs.length === 0) return (
        <PageShell title="Eventos">
            <EmptyState
                icon={Building2}
                title="Sem organização"
                description="Para criar eventos precisa de pertencer a uma organização. Contacte o administrador da plataforma."
            />
        </PageShell>
    );

    return (
        <PageShell title="Eventos" subtitle={subtitle} actions={createBtn}>
            {/* Org selector — only visible when >1 org */}
            {!loadingOrgs && orgs.length > 1 && (
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider shrink-0">Organização</label>
                    <select
                        className="text-sm border border-gray-200 bg-white text-gray-700 rounded-xl px-3 h-9 focus:outline-none focus:ring-2 focus:ring-gray-900/10 min-w-0"
                        value={orgId}
                        onChange={(e) => setOrgId(e.target.value)}
                    >
                        <option value="">Selecionar…</option>
                        {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                </div>
            )}

            <DataTable<Event>
                keyField="id"
                data={events}
                loading={loadingOrgs || (!!orgId && loadingEvents)}
                error={eventError}
                onRetry={loadEvents}
                emptyIcon={Calendar}
                emptyTitle="Sem eventos"
                emptyDescription={orgId
                    ? "Ainda não criou nenhum evento para esta organização."
                    : "Selecione uma organização para ver os eventos."}
                page={page}
                totalPages={totalPages}
                total={total}
                onPageChange={total > PAGE_SIZE ? setPage : undefined}
                columns={[
                    {
                        key: "title",
                        label: "Evento",
                        render: (e) => (
                            <div className="min-w-0">
                                <div className="font-medium text-gray-900 truncate">{e.title}</div>
                                <div className="text-xs text-gray-400 truncate">
                                    {e.venue}{e.city ? `, ${e.city}` : ""}
                                </div>
                            </div>
                        ),
                    },
                    {
                        key: "startAt",
                        label: "Data",
                        render: (e) => (
                            <span className="text-sm text-gray-500 whitespace-nowrap">
                                {new Date(e.startAt).toLocaleDateString("pt-PT")}
                            </span>
                        ),
                    },
                    {
                        key: "status",
                        label: "Estado",
                        render: (e) => (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ring-1 ring-inset ${STATUS_COLOR[e.status] ?? "bg-gray-100 text-gray-500 ring-gray-200/60"}`}>
                                {STATUS_LABEL[e.status] ?? e.status}
                            </span>
                        ),
                    },
                    {
                        key: "tickets",
                        label: "Bilhetes",
                        render: (e) => <span className="text-sm font-medium text-gray-700">{e._count.tickets}</span>,
                    },
                    {
                        key: "orders",
                        label: "Vendas",
                        render: (e) => <span className="text-sm text-gray-500">{e._count.orders}</span>,
                    },
                ]}
                rowActions={(e) => (
                    <div className="flex items-center gap-1.5">
                        <Link
                            href={`/promotor/events/${e.id}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-colors"
                        >
                            <Pencil className="h-3 w-3" />
                            Editar
                        </Link>
                        <a
                            href={`/events/${e.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-colors"
                        >
                            <ExternalLink className="h-3 w-3" />
                            Ver
                        </a>
                    </div>
                )}
            />
        </PageShell>
    );
}
