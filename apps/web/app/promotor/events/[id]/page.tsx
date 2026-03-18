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

const inputCls = "w-full rounded-2xl border border-white/10 bg-black/50 text-white placeholder:text-white/30 px-5 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition-all shadow-inner";
const labelCls = "block text-[12px] font-bold text-white/50 uppercase tracking-[0.2em] mb-3";

const STATUS_COLOR: Record<string, string> = {
    PUBLISHED: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
    DRAFT: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
    ARCHIVED: "bg-white/5 text-white/50 ring-white/10",
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
                <div className="h-10 bg-white/5 rounded-xl border border-white/10" />
                <div className="h-80 bg-white/5 rounded-[32px] border border-white/10" />
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
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider ring-1 ring-inset ${STATUS_COLOR[event.status] ?? "bg-white/5 text-white/50"}`}>
                    {STATUS_LABEL[event.status] ?? event.status}
                </span>
            }
            actions={
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                    <Link
                        href={`/promotor/events/${id}/bilhetes`}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-[13px] font-bold bg-white text-black hover:bg-white/90 transition-all shadow-lg hover:-translate-y-0.5 active:scale-95"
                    >
                        Gestão de Bilhetes & Lotação
                    </Link>
                    <Link
                        href={`/promotor/events/${id}/branding`}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-[13px] font-bold border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-all shadow-lg hover:-translate-y-0.5 active:scale-95"
                    >
                        Personalização
                    </Link>
                    <Link
                        href={orgId ? `/promotor/events?orgId=${orgId}` : "/promotor/events"}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-[13px] font-bold border border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition-all"
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
                                    <AlertCircle className="h-5 w-5 text-amber-400" strokeWidth={2} />
                                </div>
                                <div>
                                    <p className="text-[15px] font-bold text-amber-400">Este evento é um rascunho</p>
                                    <p className="text-[13px] text-amber-400/70 mt-1 font-medium leading-relaxed">Guarde as alterações e publique para tornar o evento visível ao público.</p>
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
                                <CheckCircle2 className="h-5 w-5 text-emerald-400" strokeWidth={2} />
                            </div>
                            <p className="text-[14px] text-emerald-400 font-bold">Evento publicado e visível</p>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0 sm:ml-0">
                            <a
                                href={`/events/${event.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[13px] font-bold px-5 py-2.5 text-center w-full sm:w-auto rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                            >
                                Ver página
                            </a>
                            <button
                                onClick={handleUnpublish}
                                disabled={publishing}
                                className="text-[13px] font-bold px-5 py-2.5 text-center w-full sm:w-auto rounded-xl border border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-40 transition-all"
                            >
                                {publishing ? "Aguarde…" : "Meter em Rascunho"}
                            </button>
                        </div>
                    </div>
                )}

                {/* Edit form */}
                <div className="bg-white/5 backdrop-blur-3xl rounded-[32px] border border-white/10 shadow-2xl overflow-hidden divide-y divide-white/5 relative">
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
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

                    <div className="px-6 py-6 bg-black/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <p className="text-[12px] text-white/40 font-medium">
                            URL: <span className="font-mono text-white/70">/events/{event.slug}</span>
                        </p>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-[14px] font-bold bg-white text-black hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[0_12px_30px_rgba(255,255,255,0.15)] hover:-translate-y-0.5 active:scale-95 w-full sm:w-auto"
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
