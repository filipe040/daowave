"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageShell } from "@/components/dashboard/PageShell";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { ArrowLeft, Save, Globe, AlertCircle, CheckCircle2, ExternalLink, Mic2, MapPin } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { EVENT_CATEGORIES } from "@/lib/events/event-categories";

interface EventDetail {
    id: string;
    title: string;
    slug: string;
    description: string;
    venue: string;
    city: string;
    category?: string | null;
    locationUrl?: string | null;
    startAt: string;
    endAt: string;
    status: string;
    organizationId: string | null;
    bannerUrl: string | null;
    layoutMode?: string;
}

const inputCls = "w-full rounded-2xl border border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 px-5 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-200 transition-all shadow-inner";
const labelCls = "public-label text-[12px] font-bold tracking-[0.2em] mb-3";

const STATUS_COLOR: Record<string, string> = {
    PUBLISHED: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20",
    DRAFT: "bg-amber-500/10 text-amber-600 ring-amber-500/20",
    ARCHIVED: "bg-neutral-100 text-neutral-600 ring-neutral-200",
    CANCELLED: "bg-red-500/10 text-red-400 ring-red-500/20",
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
    const [category, setCategory] = useState("");
    const [locationUrl, setLocationUrl] = useState("");
    const [startAt, setStartAt] = useState("");
    const [endAt, setEndAt] = useState("");
    const [layoutMode, setLayoutMode] = useState<"STANDARD" | "ARTISTS">("STANDARD");

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
            setCategory(data.category ?? "");
            setLocationUrl(data.locationUrl ?? "");
            setStartAt(toLocal(data.startAt));
            setEndAt(toLocal(data.endAt));
            setLayoutMode((data.layoutMode as "STANDARD" | "ARTISTS") || "STANDARD");
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
                body: JSON.stringify({ title, description, venue, city, category: category || null, locationUrl: locationUrl.trim() || null, startAt, endAt, layoutMode }),
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

    const handleUnpublish = async () => {
        setPublishing(true);
        try {
            const res = await fetchWithTimeout(`/api/promotor/events/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "DRAFT" }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({})) as { error?: string };
                throw new Error(body.error ?? "Erro ao reverter para rascunho");
            }
            toast.success("Evento revertido para rascunho!");
            await load();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Erro ao reverter");
        } finally {
            setPublishing(false);
        }
    };

    if (loading) return (
        <PageShell title="Evento">
            <div className="max-w-2xl animate-pulse space-y-3">
                <div className="h-10 bg-neutral-50 rounded-xl border border-neutral-200" />
                <div className="h-80 bg-neutral-50 rounded-[32px] border border-neutral-200" />
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
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider ring-1 ring-inset ${STATUS_COLOR[event.status] ?? "bg-neutral-50 text-neutral-500"}`}>
                    {STATUS_LABEL[event.status] ?? event.status}
                </span>
            }
            actions={
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                    {isPublished && event.layoutMode === "ARTISTS" && (
                        <Link
                            href={`/events/${event.slug}/artistas`}
                            target="_blank"
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-[13px] font-bold border border-violet-500/30 bg-violet-500/10 text-violet-600 hover:bg-violet-500/20 transition-all"
                        >
                            <Mic2 className="h-4 w-4" />
                            Ver página de artistas
                            <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                    )}
                    <Link
                        href={`/promotor/events/${id}/bilhetes?tab=artists`}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-[13px] font-bold border border-violet-500/30 bg-violet-500/10 text-violet-600 hover:bg-violet-500/20 transition-all shadow-lg hover:-translate-y-0.5 active:scale-95"
                    >
                        <Mic2 className="h-4 w-4" />
                        Artistas
                    </Link>
                    <Link
                        href={`/promotor/events/${id}/bilhetes`}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-[13px] font-bold bg-violet-600 text-white hover:bg-violet-700 transition-all shadow-lg hover:-translate-y-0.5 active:scale-95"
                    >
                        Gestão de Bilhetes & Lotação
                    </Link>
                    <Link
                        href={`/promotor/events/${id}/branding`}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-[13px] font-bold border border-neutral-300 bg-neutral-100 text-neutral-900 hover:bg-neutral-200 transition-all shadow-lg hover:-translate-y-0.5 active:scale-95"
                    >
                        Personalização
                    </Link>
                    <Link
                        href={orgId ? `/promotor/events?orgId=${orgId}` : "/promotor/events"}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-[13px] font-bold border border-neutral-200 bg-neutral-50 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-all"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Voltar
                    </Link>
                </div>
            }
        >
            <div className="max-w-2xl space-y-4">
                {/* Publish banner */}
                {isDraft && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                            <div className="flex items-start gap-4">
                                <div className="p-2.5 bg-amber-500/20 rounded-xl shrink-0 mt-0.5">
                                    <AlertCircle className="h-5 w-5 text-amber-600" strokeWidth={2} />
                                </div>
                                <div>
                                    <p className="text-[15px] font-bold text-amber-600">Este evento é um rascunho</p>
                                    <p className="text-[13px] text-amber-600/70 mt-1 font-medium leading-relaxed">Guarde as alterações e publique para tornar o evento visível ao público.</p>
                                </div>
                            </div>
                            <button
                                onClick={handlePublish}
                                disabled={publishing}
                                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-[13px] font-bold bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg hover:-translate-y-0.5 active:scale-95 shrink-0"
                            >
                                <Globe className="h-4 w-4" />
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
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-5 justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-emerald-500/20 rounded-xl shrink-0">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" strokeWidth={2} />
                            </div>
                            <p className="text-[14px] text-emerald-600 font-bold">Evento publicado e visível</p>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0 sm:ml-0">
                            <a
                                href={`/events/${event.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[13px] font-bold px-5 py-2.5 text-center w-full sm:w-auto rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-all"
                            >
                                Ver página
                            </a>
                            <button
                                onClick={handleUnpublish}
                                disabled={publishing}
                                className="text-[13px] font-bold px-5 py-2.5 text-center w-full sm:w-auto rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 disabled:opacity-40 transition-all"
                            >
                                {publishing ? "Aguarde…" : "Meter em Rascunho"}
                            </button>
                        </div>
                    </div>
                )}

                {/* Edit form */}
                <div className="rounded-3xl border border-neutral-200 bg-white shadow-md overflow-hidden divide-y divide-neutral-200 relative">
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />
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
                        <label htmlFor="category" className={labelCls}>Género / categoria</label>
                        <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
                            <option value="">Selecionar género…</option>
                            {EVENT_CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <p className="mt-2 text-xs text-neutral-500">Aparece nos filtros públicos quando o evento estiver publicado.</p>
                    </div>

                    <div className="px-6 py-5">
                        <div className="flex items-center justify-between mb-3">
                            <label htmlFor="locationUrl" className={labelCls + " mb-0"}>Link do mapa (Google Maps)</label>
                            <a
                                href="https://www.google.com/maps"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-600 hover:text-amber-700"
                            >
                                <MapPin className="h-3.5 w-3.5" />
                                Abrir Google Maps
                                <ExternalLink className="h-3 w-3" />
                            </a>
                        </div>
                        <input
                            id="locationUrl"
                            type="url"
                            value={locationUrl}
                            onChange={(e) => setLocationUrl(e.target.value)}
                            placeholder="https://maps.google.com/... — link Partilhar do local"
                            className={inputCls}
                        />
                        <p className="mt-2 text-xs text-neutral-500">Usado no mapa da página pública. Se vazio, o mapa usa o nome do local + cidade.</p>
                    </div>

                    <div className="px-6 py-5">
                        <label className={labelCls}>Tipo de página pública</label>
                        <div className="grid sm:grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setLayoutMode("STANDARD")}
                                className={`p-4 rounded-2xl border text-left transition-all ${layoutMode === "STANDARD" ? "border-violet-600 bg-violet-50 ring-1 ring-violet-200" : "border-neutral-200 bg-neutral-50 hover:bg-neutral-100"}`}
                            >
                                <p className="font-bold text-neutral-900 text-[14px]">Evento clássico</p>
                                <p className="text-xs text-neutral-500 mt-1">Uma página com todos os bilhetes.</p>
                            </button>
                            <button
                                type="button"
                                onClick={() => setLayoutMode("ARTISTS")}
                                className={`p-4 rounded-2xl border text-left transition-all ${layoutMode === "ARTISTS" ? "border-violet-600 bg-violet-50 ring-1 ring-violet-200" : "border-neutral-200 bg-neutral-50 hover:bg-neutral-100"}`}
                            >
                                <p className="font-bold text-neutral-900 text-[14px]">Bilhetes por artista</p>
                                <p className="text-xs text-neutral-500 mt-1">Grelha de artistas com página individual.</p>
                            </button>
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

                    <div className="px-6 py-6 bg-neutral-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <p className="text-[12px] text-neutral-500 font-medium">
                            URL: <span className="font-mono text-neutral-600">/events/{event.slug}</span>
                        </p>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-[14px] font-bold bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-md hover:-translate-y-0.5 active:scale-95 w-full sm:w-auto"
                        >
                            <Save className="h-4 w-4" />
                            {saving ? "A guardar…" : "Guardar alterações"}
                        </button>
                    </div>
                </div>
            </div>
        </PageShell>
    );
}
