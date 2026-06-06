"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { ArrowLeft, Building2, Save, MapPin, ExternalLink } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { EVENT_CATEGORIES } from "@/lib/events/event-categories";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

interface Org { id: string; name: string; role: string }

function slugify(str: string) {
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
}

const inputCls = "w-full rounded-2xl border border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 px-5 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-200 transition-all shadow-inner";
const labelCls = "public-label text-[12px] font-bold tracking-[0.2em] mb-3";

export default function CreateEventPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const preOrgId = searchParams.get("orgId") ?? "";

    const [orgs, setOrgs] = useState<Org[]>([]);
    const [orgId, setOrgId] = useState(preOrgId);
    const [loadingOrgs, setLoadingOrgs] = useState(true);
    const [orgError, setOrgError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [slugManual, setSlugManual] = useState(false);
    const [description, setDescription] = useState("");
    const [venue, setVenue] = useState("");
    const [city, setCity] = useState("");
    const [category, setCategory] = useState("");
    const [locationUrl, setLocationUrl] = useState("");
    const [startAt, setStartAt] = useState("");
    const [endAt, setEndAt] = useState("");
    const [layoutMode, setLayoutMode] = useState<"STANDARD" | "ARTISTS">("STANDARD");

    const loadOrgs = useCallback(async () => {
        setLoadingOrgs(true); setOrgError(null);
        try {
            const res = await fetchWithTimeout("/api/promotor/organizations");
            if (!res.ok) throw new Error(`Erro ${res.status}`);
            const json = await res.json() as { data: Org[] };
            const data = json.data ?? [];
            setOrgs(data);
            if (!preOrgId && data.length === 1) setOrgId(data[0].id);
        } catch (err: unknown) { setOrgError(err instanceof Error ? err.message : "Erro"); }
        finally { setLoadingOrgs(false); }
    }, [preOrgId]);

    useEffect(() => { loadOrgs(); }, [loadOrgs]);
    useEffect(() => { if (!slugManual) setSlug(slugify(title)); }, [title, slugManual]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orgId) { toast.error("Selecione uma organização"); return; }
        if (new Date(endAt) <= new Date(startAt)) { toast.error("A data de fim deve ser posterior ao início"); return; }
        setSubmitting(true); setFormError(null);
        try {
            const res = await fetchWithTimeout("/api/promotor/events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, slug, description, venue, city, category: category || undefined, locationUrl: locationUrl.trim() || undefined, startAt, endAt, orgId, layoutMode }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({})) as { error?: string };
                throw new Error(body.error ?? `Erro ${res.status}`);
            }
            toast.success("Evento criado com sucesso!");
            router.push(`/promotor/events?orgId=${orgId}`);
        } catch (err: unknown) {
            setFormError(err instanceof Error ? err.message : "Erro ao criar evento");
        } finally { setSubmitting(false); }
    };

    if (loadingOrgs) return (
        <PageShell title="Criar Evento">
            <div className="max-w-2xl animate-pulse space-y-3">
                <div className="h-10 bg-neutral-50 rounded-xl border border-neutral-200" />
                <div className="h-64 bg-neutral-50 rounded-[32px] border border-neutral-200" />
            </div>
        </PageShell>
    );

    if (orgError) return <PageShell title="Criar Evento"><ErrorState message={orgError} onRetry={loadOrgs} /></PageShell>;

    if (orgs.length === 0) return (
        <PageShell title="Criar Evento">
            <EmptyState icon={Building2} title="Sem organização" description="Para criar eventos precisa de pertencer a uma organização como OWNER ou MANAGER. Contacte o administrador." />
        </PageShell>
    );

    return (
        <PageShell
            title="Criar Evento"
            subtitle="Preencha os detalhes do novo evento"
            actions={
                <Link href={`/promotor/events${orgId ? `?orgId=${orgId}` : ""}`} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold border border-neutral-200 bg-neutral-50 text-neutral-900 hover:bg-neutral-100 transition-all hover:-translate-y-0.5 shadow-lg active:scale-95">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                </Link>
            }
        >
            <form onSubmit={handleSubmit} className="max-w-2xl">
                <div className="rounded-3xl border border-neutral-200 bg-white shadow-md overflow-hidden divide-y divide-neutral-200 relative">
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />

                    {/* Org selector — only if >1 */}
                    {orgs.length > 1 && (
                        <div className="px-6 py-5">
                            <label className={labelCls}>Organização *</label>
                            <select required value={orgId} onChange={(e) => setOrgId(e.target.value)} className={inputCls}>
                                <option value="">Selecionar organização…</option>
                                {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                            </select>
                        </div>
                    )}

                    <div className="px-6 py-5">
                        <label htmlFor="title" className={labelCls}>Título *</label>
                        <input id="title" required placeholder="Ex: Festival de Verão 2025" value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
                    </div>

                    <div className="px-6 py-5">
                        <label htmlFor="slug" className={labelCls}>URL Slug *</label>
                        <input
                            id="slug" required pattern="[a-z0-9-]+"
                            placeholder="festival-verao-2025"
                            value={slug}
                            onChange={(e) => { setSlug(e.target.value); setSlugManual(true); }}
                            className={`${inputCls} font-mono`}
                        />
                        <p className="mt-3 text-xs text-neutral-500 font-medium">Link do Evento: tickets.daowave.pt/events/<span className="text-neutral-900 font-bold">{slug || "…"}</span></p>
                    </div>

                    <div className="px-6 py-5 grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="startAt" className={labelCls}>Início *</label>
                            <input id="startAt" required type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} className={inputCls} />
                        </div>
                        <div>
                            <label htmlFor="endAt" className={labelCls}>Fim *</label>
                            <input id="endAt" required type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} className={inputCls} />
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

                    <div className="px-6 py-5 grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="venue" className={labelCls}>Local *</label>
                            <input id="venue" required placeholder="Altice Arena" value={venue} onChange={(e) => setVenue(e.target.value)} className={inputCls} />
                        </div>
                        <div>
                            <label htmlFor="city" className={labelCls}>Cidade *</label>
                            <input id="city" required placeholder="Lisboa" value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} />
                        </div>
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
                            placeholder="https://maps.google.com/... ou link Partilhar do Google Maps"
                            value={locationUrl}
                            onChange={(e) => setLocationUrl(e.target.value)}
                            className={inputCls}
                        />
                        <p className="mt-2 text-xs text-neutral-500">Opcional. Cole o link partilhado do Google Maps — será usado no mapa da página pública.</p>
                    </div>

                    <div className="px-6 py-5">
                        <label className={labelCls}>Tipo de página *</label>
                        <div className="grid sm:grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setLayoutMode("STANDARD")}
                                className={`p-4 rounded-2xl border text-left transition-all ${layoutMode === "STANDARD" ? "border-violet-600 bg-violet-50 ring-1 ring-violet-200" : "border-neutral-200 bg-neutral-50 hover:bg-neutral-100"}`}
                            >
                                <p className="font-bold text-neutral-900 text-[14px]">Evento clássico</p>
                                <p className="text-xs text-neutral-500 mt-1">Uma página com todos os bilhetes do evento.</p>
                            </button>
                            <button
                                type="button"
                                onClick={() => setLayoutMode("ARTISTS")}
                                className={`p-4 rounded-2xl border text-left transition-all ${layoutMode === "ARTISTS" ? "border-violet-600 bg-violet-50 ring-1 ring-violet-200" : "border-neutral-200 bg-neutral-50 hover:bg-neutral-100"}`}
                            >
                                <p className="font-bold text-neutral-900 text-[14px]">Bilhetes por artista</p>
                                <p className="text-xs text-neutral-500 mt-1">Grid de artistas com página individual e poster (estilo festival).</p>
                            </button>
                        </div>
                    </div>

                    <div className="px-6 py-5">
                        <label htmlFor="description" className={labelCls}>Descrição</label>
                        <textarea id="description" rows={4} placeholder="Sobre o evento…" value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputCls} resize-none`} />
                    </div>

                    {formError && (
                        <div className="px-8 py-5 bg-red-500/10 border-t border-red-500/20">
                            <p className="text-[14px] font-bold text-red-400">{formError}</p>
                        </div>
                    )}

                    <div className="px-8 py-6 bg-neutral-50 flex justify-end">
                        <button
                            type="submit"
                            disabled={submitting || !orgId}
                            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-[14px] font-bold bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-md hover:-translate-y-0.5 active:scale-95"
                        >
                            <Save className="h-4 w-4" />
                            {submitting ? "A criar…" : "Criar Evento"}
                        </button>
                    </div>
                </div>
            </form>
        </PageShell>
    );
}
