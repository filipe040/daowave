"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageShell } from "@/components/dashboard/PageShell";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { ArrowLeft, Save, Globe, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

interface EventDetail {
    id: string;
    title: string;
    slug: string;
    description: string;
    venue: string;
    city: string;
    startAt: string;
    endAt: string;
    status: string;
    organizationId: string | null;
    bannerUrl: string | null;
}

const inputCls = "w-full rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-colors";
const labelCls = "block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5";

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

function toLocal(iso: string) {
    if (!iso) return "";
    return new Date(iso).toISOString().slice(0, 16);
}

export default function PromoterEventDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const [event, setEvent] = useState<EventDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [publishError, setPublishError] = useState<string | null>(null);
    const [publishDetails, setPublishDetails] = useState<Array<{ field: string; message: string }>>([]);

    // Form fields
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [venue, setVenue] = useState("");
    const [city, setCity] = useState("");
    const [startAt, setStartAt] = useState("");
    const [endAt, setEndAt] = useState("");

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await fetchWithTimeout(`/api/promotor/events/${id}`);
            if (!res.ok) throw new Error(`Erro ${res.status}`);
            const data = await res.json() as EventDetail;
            setEvent(data);
            setTitle(data.title);
            setDescription(data.description ?? "");
            setVenue(data.venue ?? "");
            setCity(data.city ?? "");
            setStartAt(toLocal(data.startAt));
            setEndAt(toLocal(data.endAt));
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Erro ao carregar evento");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { load(); }, [load]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetchWithTimeout(`/api/promotor/events/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, description, venue, city, startAt, endAt }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({})) as { error?: string };
                throw new Error(body.error ?? `Erro ${res.status}`);
            }
            toast.success("Evento guardado!");
            await load();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Erro ao guardar");
        } finally {
            setSaving(false);
        }
    };

    const handlePublish = async () => {
        setPublishing(true); setPublishError(null); setPublishDetails([]);
        try {
            const res = await fetchWithTimeout(`/api/promotor/events/${id}/publish`, {
                method: "POST",
            });
            const body = await res.json() as { error?: string; details?: Array<{ field: string; message: string }> };
            if (!res.ok) {
                setPublishError(body.error ?? `Erro ${res.status}`);
                setPublishDetails(body.details ?? []);
                return;
            }
            toast.success("Evento publicado com sucesso!");
            await load();
        } catch (err: unknown) {
            setPublishError(err instanceof Error ? err.message : "Erro ao publicar");
        } finally {
            setPublishing(false);
        }
    };

    if (loading) return (
        <PageShell title="Evento">
            <div className="max-w-2xl animate-pulse space-y-3">
                <div className="h-10 bg-gray-100 rounded-xl" />
                <div className="h-80 bg-white rounded-2xl border border-gray-200" />
            </div>
        </PageShell>
    );

    if (error || !event) return (
        <PageShell title="Evento">
            <ErrorState message={error ?? "Evento não encontrado"} onRetry={load} />
        </PageShell>
    );

    const isDraft = event.status === "DRAFT";
    const isPublished = event.status === "PUBLISHED";
    const orgId = event.organizationId;

    return (
        <PageShell
            title={event.title || "Evento"}
            subtitle={
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ring-1 ring-inset ${STATUS_COLOR[event.status] ?? "bg-gray-100 text-gray-500"}`}>
                    {STATUS_LABEL[event.status] ?? event.status}
                </span>
            }
            actions={
                <Link
                    href={orgId ? `/promotor/events?orgId=${orgId}` : "/promotor/events"}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Voltar
                </Link>
            }
        >
            <div className="max-w-2xl space-y-4">
                {/* Publish banner */}
                {isDraft && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" strokeWidth={1.75} />
                                <div>
                                    <p className="text-sm font-semibold text-amber-800">Este evento é um rascunho</p>
                                    <p className="text-xs text-amber-600 mt-0.5">Guarde as alterações e publique para tornar o evento visível ao público.</p>
                                </div>
                            </div>
                            <button
                                onClick={handlePublish}
                                disabled={publishing}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                            >
                                <Globe className="h-3.5 w-3.5" />
                                {publishing ? "A publicar…" : "Publicar evento"}
                            </button>
                        </div>

                        {/* Publish errors */}
                        {publishError && (
                            <div className="mt-4 pt-4 border-t border-amber-200">
                                <p className="text-sm text-red-700 font-medium">{publishError}</p>
                                {publishDetails.length > 0 && (
                                    <ul className="mt-2 space-y-1">
                                        {publishDetails.map((d, i) => (
                                            <li key={i} className="text-xs text-red-600 flex items-start gap-1.5">
                                                <span className="mt-0.5 shrink-0">•</span>
                                                <span><span className="font-medium">{d.field}:</span> {d.message}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {isPublished && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" strokeWidth={1.75} />
                        <p className="text-sm text-emerald-700 font-medium">Evento público e visível ao público</p>
                        <a
                            href={`/events/${event.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto text-xs text-emerald-600 hover:text-emerald-800 underline shrink-0"
                        >
                            Ver página
                        </a>
                    </div>
                )}

                {/* Edit form */}
                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden divide-y divide-gray-100">
                    <div className="px-6 py-5">
                        <label htmlFor="title" className={labelCls}>Título *</label>
                        <input
                            id="title"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className={inputCls}
                        />
                    </div>

                    <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="startAt" className={labelCls}>Início *</label>
                            <input
                                id="startAt"
                                type="datetime-local"
                                value={startAt}
                                onChange={(e) => setStartAt(e.target.value)}
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label htmlFor="endAt" className={labelCls}>Fim *</label>
                            <input
                                id="endAt"
                                type="datetime-local"
                                value={endAt}
                                onChange={(e) => setEndAt(e.target.value)}
                                className={inputCls}
                            />
                        </div>
                    </div>

                    <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="venue" className={labelCls}>Local *</label>
                            <input
                                id="venue"
                                value={venue}
                                onChange={(e) => setVenue(e.target.value)}
                                placeholder="Altice Arena"
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label htmlFor="city" className={labelCls}>Cidade *</label>
                            <input
                                id="city"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder="Lisboa"
                                className={inputCls}
                            />
                        </div>
                    </div>

                    <div className="px-6 py-5">
                        <label htmlFor="description" className={labelCls}>Descrição</label>
                        <textarea
                            id="description"
                            rows={5}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Descrição do evento…"
                            className={`${inputCls} resize-none`}
                        />
                    </div>

                    <div className="px-6 py-4 bg-gray-50/50 flex items-center justify-between gap-3">
                        <p className="text-xs text-gray-400">
                            URL: <span className="font-mono text-gray-600">/events/{event.slug}</span>
                        </p>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <Save className="h-3.5 w-3.5" />
                            {saving ? "A guardar…" : "Guardar alterações"}
                        </button>
                    </div>
                </div>
            </div>
        </PageShell>
    );
}
