"use client";

import { useEffect, useState, useCallback } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { DataTable } from "@/components/dashboard/DataTable";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { Calendar, Plus, ExternalLink, Building2 } from "lucide-react";
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
    PUBLISHED: "bg-emerald-50 text-emerald-700",
    DRAFT: "bg-amber-50 text-amber-700",
    ARCHIVED: "bg-gray-100 text-gray-500",
    CANCELLED: "bg-red-50 text-red-600",
};
const STATUS_LABEL: Record<string, string> = {
    PUBLISHED: "Publicado",
    DRAFT: "Rascunho",
    ARCHIVED: "Arquivado",
    CANCELLED: "Cancelado",
};

export default function PromoterEventsPage() {
    const [orgs, setOrgs] = useState<Org[]>([]);
    const [orgId, setOrgId] = useState("");
    const [events, setEvents] = useState<Event[]>([]);
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
            const res = await fetchWithTimeout(`/api/promotor/events?orgId=${orgId}&page=1`);
            if (!res.ok) throw new Error(`Erro ${res.status}`);
            const json = await res.json() as { events?: Event[] };
            setEvents(json.events ?? []);
        } catch (err: unknown) { setEventError(err instanceof Error ? err.message : "Erro"); }
        finally { setLoadingEvents(false); }
    }, [orgId]);

    useEffect(() => { loadOrgs(); }, [loadOrgs]);
    useEffect(() => { if (orgId) loadEvents(); }, [orgId, loadEvents]);

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
        <PageShell title="Eventos" subtitle="Gerir os seus eventos" actions={createBtn}>
            {orgs.length > 1 && (
                <div className="flex items-center gap-3 mb-4">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Organização</label>
                    <select
                        className="text-sm border border-gray-200 bg-white text-gray-700 rounded-xl px-3 h-9 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
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
                emptyDescription="Ainda não criou nenhum evento para esta organização."
                columns={[
                    {
                        key: "title",
                        label: "Evento",
                        render: (e) => (
                            <div>
                                <div className="font-medium text-gray-900">{e.title}</div>
                                <div className="text-xs text-gray-400">{e.venue}{e.city ? `, ${e.city}` : ""}</div>
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
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_COLOR[e.status] ?? "bg-gray-100 text-gray-500"}`}>
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
                        label: "Encomendas",
                        render: (e) => <span className="text-sm text-gray-500">{e._count.orders}</span>,
                    },
                ]}
                rowActions={(e) => (
                    <a
                        href={`/events/${e.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                        <ExternalLink className="h-3 w-3" />
                        Ver
                    </a>
                )}
            />
        </PageShell>
    );
}
