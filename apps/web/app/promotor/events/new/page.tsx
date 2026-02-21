"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { ArrowLeft, Building2, Save } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

interface Org { id: string; name: string; role: string }

function slugify(str: string) {
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/[\s]+/g, "-");
}

export default function CreateEventPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const preselectedOrgId = searchParams.get("orgId") ?? "";

    const [orgs, setOrgs] = useState<Org[]>([]);
    const [orgId, setOrgId] = useState(preselectedOrgId);
    const [loadingOrgs, setLoadingOrgs] = useState(true);
    const [orgError, setOrgError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const titleRef = useRef<HTMLInputElement>(null);
    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [slugManual, setSlugManual] = useState(false);
    const [description, setDescription] = useState("");
    const [venue, setVenue] = useState("");
    const [city, setCity] = useState("");
    const [startAt, setStartAt] = useState("");
    const [endAt, setEndAt] = useState("");
    const [formError, setFormError] = useState<string | null>(null);

    const loadOrgs = useCallback(async () => {
        setLoadingOrgs(true); setOrgError(null);
        try {
            const res = await fetchWithTimeout("/api/promotor/organizations");
            if (!res.ok) throw new Error(`Erro ${res.status}`);
            const json = await res.json() as { data: Org[] };
            const data = json.data ?? [];
            setOrgs(data);
            if (!preselectedOrgId && data.length === 1) setOrgId(data[0].id);
        } catch (err: unknown) { setOrgError(err instanceof Error ? err.message : "Erro"); }
        finally { setLoadingOrgs(false); }
    }, [preselectedOrgId]);

    useEffect(() => { loadOrgs(); }, [loadOrgs]);

    // Auto-generate slug from title
    useEffect(() => {
        if (!slugManual) setSlug(slugify(title));
    }, [title, slugManual]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orgId) { toast.error("Selecione uma organização"); return; }
        if (!startAt || !endAt) { toast.error("Datas obrigatórias"); return; }
        if (new Date(endAt) <= new Date(startAt)) { toast.error("A data de fim deve ser posterior ao início"); return; }

        setSubmitting(true); setFormError(null);
        try {
            const res = await fetchWithTimeout("/api/promotor/events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, slug, description, venue, city, startAt, endAt, orgId }),
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

    // ── Org loading states ──
    if (loadingOrgs) return (
        <PageShell title="Criar Evento">
            <div className="max-w-2xl space-y-3 animate-pulse">
                <div className="h-10 bg-gray-100 rounded-xl w-full" />
                <div className="h-64 bg-white rounded-2xl border border-gray-200" />
            </div>
        </PageShell>
    );

    if (orgError) return (
        <PageShell title="Criar Evento">
            <ErrorState message={orgError} onRetry={loadOrgs} />
        </PageShell>
    );

    if (orgs.length === 0) return (
        <PageShell title="Criar Evento">
            <EmptyState
                icon={Building2}
                title="Sem organização"
                description="Para criar eventos precisa de pertencer a uma organização como OWNER ou MANAGER. Contacte o administrador da plataforma."
            />
        </PageShell>
    );

    const inputCls = "w-full rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-colors";
    const labelCls = "block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5";

    return (
        <PageShell
            title="Criar Evento"
            subtitle="Preencha os detalhes do novo evento"
            actions={
                <Link
                    href={`/promotor/events${orgId ? `?orgId=${orgId}` : ""}`}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Voltar
                </Link>
            }
        >
            <form onSubmit={handleSubmit} className="max-w-2xl">
                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden space-y-0 divide-y divide-gray-100">
                    {/* Org selector (if >1) */}
                    {orgs.length > 1 && (
                        <div className="px-6 py-5 space-y-1.5">
                            <label className={labelCls}>Organização</label>
                            <select
                                required
                                value={orgId}
                                onChange={(e) => setOrgId(e.target.value)}
                                className={inputCls}
                            >
                                <option value="">Selecionar organização…</option>
                                {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                            </select>
                        </div>
                    )}

                    {/* Title */}
                    <div className="px-6 py-5 space-y-1.5">
                        <label htmlFor="title" className={labelCls}>Título do Evento *</label>
                        <input
                            id="title" ref={titleRef} required
                            placeholder="Ex: Festival de Verão 2025"
                            value={title} onChange={(e) => setTitle(e.target.value)}
                            className={inputCls}
                        />
                    </div>

                    {/* Slug */}
                    <div className="px-6 py-5 space-y-1.5">
                        <label htmlFor="slug" className={labelCls}>URL Slug *</label>
                        <input
                            id="slug" required pattern="[a-z0-9-]+"
                            placeholder="festival-verao-2025"
                            value={slug}
                            onChange={(e) => { setSlug(e.target.value); setSlugManual(true); }}
                            className={`${inputCls} font-mono`}
                        />
                        <p className="text-xs text-gray-400">tickets.daowave.pt/events/<span className="text-gray-600">{slug || "…"}</span></p>
                    </div>

                    {/* Dates */}
                    <div className="px-6 py-5 grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label htmlFor="startAt" className={labelCls}>Início *</label>
                            <input id="startAt" type="datetime-local" required value={startAt} onChange={(e) => setStartAt(e.target.value)} className={inputCls} />
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="endAt" className={labelCls}>Fim *</label>
                            <input id="endAt" type="datetime-local" required value={endAt} onChange={(e) => setEndAt(e.target.value)} className={inputCls} />
                        </div>
                    </div>

                    {/* Venue & City */}
                    <div className="px-6 py-5 grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label htmlFor="venue" className={labelCls}>Local *</label>
                            <input id="venue" required placeholder="Altice Arena" value={venue} onChange={(e) => setVenue(e.target.value)} className={inputCls} />
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="city" className={labelCls}>Cidade *</label>
                            <input id="city" required placeholder="Lisboa" value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="px-6 py-5 space-y-1.5">
                        <label htmlFor="description" className={labelCls}>Descrição</label>
                        <textarea
                            id="description" rows={4}
                            placeholder="Sobre o evento…"
                            value={description} onChange={(e) => setDescription(e.target.value)}
                            className={`${inputCls} resize-none`}
                        />
                    </div>

                    {/* Error */}
                    {formError && (
                        <div className="px-6 py-4 bg-red-50 border-t border-red-100">
                            <p className="text-sm text-red-600">{formError}</p>
                        </div>
                    )}

                    {/* Submit */}
                    <div className="px-6 py-4 bg-gray-50/50 flex justify-end">
                        <button
                            type="submit"
                            disabled={submitting || !orgId}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <Save className="h-3.5 w-3.5" />
                            {submitting ? "A criar…" : "Criar Evento"}
                        </button>
                    </div>
                </div>
            </form>
        </PageShell>
    );
}
