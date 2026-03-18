"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageShell } from "@/components/dashboard/PageShell";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { ArrowLeft, Save, Palette, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

interface EventBranding {
    id: string;
    title: string;
    organizationId: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    logoUrl: string | null;
    bannerUrl: string | null;
}

const inputCls = "w-full rounded-2xl border border-white/10 bg-black/50 text-white placeholder:text-white/30 px-5 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition-all shadow-inner";
const labelCls = "block text-[12px] font-bold text-white/50 uppercase tracking-[0.2em] mb-3";

export default function PromoterEventBrandingPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const [event, setEvent] = useState<EventBranding | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Form fields
    const [primaryColor, setPrimaryColor] = useState("#6C2BD9");
    const [secondaryColor, setSecondaryColor] = useState("#06B6D4");
    const [logoUrl, setLogoUrl] = useState("");
    const [bannerUrl, setBannerUrl] = useState("");

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await fetchWithTimeout(`/api/promotor/events/${id}`);
            if (!res.ok) throw new Error(`Erro ${res.status}`);
            const data = await res.json() as EventBranding;
            setEvent(data);
            setPrimaryColor(data.primaryColor || "#6C2BD9");
            setSecondaryColor(data.secondaryColor || "#06B6D4");
            setLogoUrl(data.logoUrl || "");
            setBannerUrl(data.bannerUrl || "");
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
            const res = await fetchWithTimeout(`/api/promotor/events/${id}/branding`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ primaryColor, secondaryColor, logoUrl, bannerUrl }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({})) as { error?: string };
                throw new Error(body.error ?? `Erro ${res.status}`);
            }
            toast.success("Design do evento guardado!");
            await load();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Erro ao guardar definições");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <PageShell title="Personalização">
            <div className="max-w-2xl animate-pulse space-y-3">
                <div className="h-10 bg-white/5 rounded-xl border border-white/10" />
                <div className="h-80 bg-white/5 rounded-[32px] border border-white/10" />
            </div>
        </PageShell>
    );

    if (error || !event) return (
        <PageShell title="Personalização">
            <ErrorState message={error ?? "Evento não encontrado"} onRetry={load} />
        </PageShell>
    );

    return (
        <PageShell
            title={`Personalizar: ${event.title}`}
            subtitle="Configura as cores e imagens para a página pública do teu evento"
            actions={
                <div className="flex flex-col sm:flex-row sm:items-center w-full sm:w-auto mt-4 sm:mt-0">
                    <Link
                        href={`/promotor/events/${id}`}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-[13px] font-bold border border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Voltar ao Evento
                    </Link>
                </div>
            }
        >
            <div className="max-w-2xl space-y-4">
                {/* Branding form */}
                <div className="bg-white/5 backdrop-blur-3xl rounded-[32px] border border-white/10 shadow-2xl overflow-hidden divide-y divide-white/5 relative">
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    
                    <div className="p-6 pb-4 flex items-center gap-3 border-b border-white/5">
                        <Palette className="h-5 w-5 text-white/50" />
                        <h2 className="text-sm font-bold text-white tracking-widest uppercase">Cores da Marca</h2>
                    </div>

                    <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="primaryColor" className={labelCls}>Cor Primária</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    id="primaryColor"
                                    value={primaryColor}
                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                    className="h-12 w-16 p-1 rounded-xl bg-black/50 border border-white/10 cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={primaryColor}
                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                    className={`${inputCls} flex-1`}
                                    placeholder="#6C2BD9"
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="secondaryColor" className={labelCls}>Cor Secundária</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    id="secondaryColor"
                                    value={secondaryColor}
                                    onChange={(e) => setSecondaryColor(e.target.value)}
                                    className="h-12 w-16 p-1 rounded-xl bg-black/50 border border-white/10 cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={secondaryColor}
                                    onChange={(e) => setSecondaryColor(e.target.value)}
                                    className={`${inputCls} flex-1`}
                                    placeholder="#06B6D4"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-6 pb-4 flex items-center gap-3 border-b border-white/5 bg-black/20">
                        <ImageIcon className="h-5 w-5 text-white/50" />
                        <h2 className="text-sm font-bold text-white tracking-widest uppercase">Imagens do Evento</h2>
                    </div>

                    <div className="px-6 py-5 space-y-6 bg-black/20">
                        <div>
                            <label htmlFor="bannerUrl" className={labelCls}>URL do Banner/Capa (Opcional)</label>
                            <input
                                id="bannerUrl"
                                type="url"
                                value={bannerUrl}
                                onChange={(e) => setBannerUrl(e.target.value)}
                                placeholder="https://exemplo.com/imagem-banner.jpg"
                                className={inputCls}
                            />
                            <p className="mt-2 text-[11px] text-white/40">Coloque o link/URL direto de uma imagem para apresentar no topo da página do evento.</p>
                        </div>
                        
                        <div>
                            <label htmlFor="logoUrl" className={labelCls}>URL do Logotipo (Opcional)</label>
                            <input
                                id="logoUrl"
                                type="url"
                                value={logoUrl}
                                onChange={(e) => setLogoUrl(e.target.value)}
                                placeholder="https://exemplo.com/logotipo.png"
                                className={inputCls}
                            />
                        </div>
                    </div>

                    <div className="px-6 py-6 bg-black/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <p className="text-[12px] text-white/40 font-medium">
                            As alterações refletem-se na página do evento de imediato.
                        </p>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-[14px] font-bold bg-white text-black hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[0_12px_30px_rgba(255,255,255,0.15)] hover:-translate-y-0.5 active:scale-95 w-full sm:w-auto"
                        >
                            <Save className="h-4 w-4" />
                            {saving ? "A guardar…" : "Guardar Personalização"}
                        </button>
                    </div>
                </div>
            </div>
        </PageShell>
    );
}
