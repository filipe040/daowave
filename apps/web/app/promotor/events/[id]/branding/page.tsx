"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageShell } from "@/components/dashboard/PageShell";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { ArrowLeft, Save, Palette, Image as ImageIcon, Type, LayoutTemplate, Ticket } from "lucide-react";
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
    fontFamily: string | null;
    useCustomLandingPage: boolean;
    landingPageContent: string | null;
    ticketTemplateId: string | null;
}

const inputCls = "w-full rounded-2xl border border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 px-5 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-200 transition-all shadow-inner";
const labelCls = "public-label text-[12px] font-bold tracking-[0.2em] mb-3";

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
    const [fontFamily, setFontFamily] = useState("Inter");
    const [useCustomLandingPage, setUseCustomLandingPage] = useState(false);
    const [landingPageContent, setLandingPageContent] = useState("");
    const [ticketTemplateId, setTicketTemplateId] = useState("");
    const [templates, setTemplates] = useState<{ id: string; name: string }[]>([]);

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
            setFontFamily(data.fontFamily || "Inter");
            setUseCustomLandingPage(data.useCustomLandingPage || false);
            setLandingPageContent(data.landingPageContent || "");
            setTicketTemplateId(data.ticketTemplateId || "");
            
            // Fetch templates
            const tRes = await fetchWithTimeout("/api/promotor/ticket-templates");
            if (tRes.ok) {
                const tData = await tRes.json();
                setTemplates(tData);
            }
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
                body: JSON.stringify({ 
                    primaryColor, 
                    secondaryColor, 
                    logoUrl, 
                    bannerUrl,
                    fontFamily,
                    useCustomLandingPage,
                    landingPageContent,
                    ticketTemplateId: ticketTemplateId || null
                }),
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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (v: string) => void) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        const toastId = toast.loading("A carregar imagem...");
        try {
            const formData = new FormData();
            formData.append("file", file);
            
            const res = await fetch(`/api/promotor/events/${id}/assets/upload`, {
                method: "POST",
                body: formData,
            });
            
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Erro ao fazer upload");
            }
            
            const data = await res.json();
            setter(data.asset.url);
            toast.success("Imagem carregada com sucesso!", { id: toastId });
        } catch (err: any) {
            toast.error(err.message || "Falha no upload", { id: toastId });
        }
    };

    if (loading) return (
        <PageShell title="Design da Página">
            <div className="max-w-2xl animate-pulse space-y-3">
                <div className="h-10 bg-neutral-50 rounded-xl border border-neutral-200" />
                <div className="h-80 bg-neutral-50 rounded-[32px] border border-neutral-200" />
            </div>
        </PageShell>
    );

    if (error || !event) return (
        <PageShell title="Design da Página">
            <ErrorState message={error ?? "Evento não encontrado"} onRetry={load} />
        </PageShell>
    );

    return (
        <PageShell
            title={`Design: ${event.title}`}
            subtitle="Personaliza por completo a aparência da landing page do evento"
            actions={
                <div className="flex flex-col sm:flex-row sm:items-center w-full sm:w-auto mt-4 sm:mt-0">
                    <Link
                        href={`/promotor/events/${id}`}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-[13px] font-bold border border-neutral-200 bg-neutral-50 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-all"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Voltar ao Evento
                    </Link>
                </div>
            }
        >
            <div className="max-w-3xl space-y-4">
                <div className="rounded-3xl border border-neutral-200 bg-white shadow-md overflow-hidden divide-y divide-neutral-200 relative">
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />
                    
                    {/* Colors & Typography */}
                    <div className="p-6 pb-4 flex items-center gap-3 border-b border-neutral-200">
                        <Palette className="h-5 w-5 text-neutral-500" />
                        <h2 className="text-sm font-bold text-neutral-900 tracking-widest uppercase">Cores & Tipografia</h2>
                    </div>

                    <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="primaryColor" className={labelCls}>Cor Primária</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    id="primaryColor"
                                    value={primaryColor}
                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                    className="h-12 w-16 p-1 rounded-xl bg-white border border-neutral-200 cursor-pointer"
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
                                    className="h-12 w-16 p-1 rounded-xl bg-white border border-neutral-200 cursor-pointer"
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
                    
                    <div className="px-6 pb-6 border-b border-neutral-200">
                        <label className={labelCls}><Type className="inline-block w-3 h-3 mr-1" /> Tipo de Letra (Font Family)</label>
                        <select 
                            value={fontFamily} 
                            onChange={e => setFontFamily(e.target.value)} 
                            className={`${inputCls} appearance-none cursor-pointer`}
                        >
                            <option value="Inter">Inter (Moderna & Simples)</option>
                            <option value="Roboto">Roboto (Clássica)</option>
                            <option value="Playfair Display">Playfair Display (Elegante & Serifada)</option>
                            <option value="Outfit">Outfit (Geométrica)</option>
                            <option value="Montserrat">Montserrat (Minimalista)</option>
                        </select>
                    </div>

                    {/* Images */}
                    <div className="p-6 pb-4 flex items-center gap-3 border-b border-neutral-200 bg-neutral-50">
                        <ImageIcon className="h-5 w-5 text-neutral-500" />
                        <h2 className="text-sm font-bold text-neutral-900 tracking-widest uppercase">Imagens do Evento</h2>
                    </div>

                    <div className="px-6 py-6 space-y-8 bg-neutral-50">
                        <div>
                            <label className={labelCls}>Banner / Capa (Recomendado: 1920x1080)</label>
                            <div className="space-y-4">
                                <div className="p-4 border border-dashed border-neutral-300 rounded-2xl bg-neutral-50 hover:bg-neutral-50 transition-colors relative overflow-hidden group">
                                    <input 
                                        type="file" 
                                        accept="image/png, image/jpeg, image/jpg, image/webp" 
                                        onChange={(e) => handleFileUpload(e, setBannerUrl)} 
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                        title="Clique ou arraste a imagem do seu computador"
                                    />
                                    <div className="flex flex-col items-center justify-center py-4 text-center pointer-events-none">
                                        <div className="w-12 h-12 rounded-full bg-neutral-50 flex items-center justify-center mb-3">
                                            <ImageIcon className="w-5 h-5 text-neutral-500" />
                                        </div>
                                        <p className="text-sm font-bold text-neutral-900 mb-1">Upload a partir do PC</p>
                                        <p className="text-xs text-neutral-500">Arraste a sua imagem ou clique para procurar ficheiros</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 h-px bg-neutral-100" />
                                    <span className="text-xs text-neutral-400 font-bold uppercase tracking-widest">ou link externo</span>
                                    <div className="flex-1 h-px bg-neutral-100" />
                                </div>
                                <input
                                    type="url"
                                    value={bannerUrl}
                                    onChange={(e) => setBannerUrl(e.target.value)}
                                    placeholder="https://exemplo.com/imagem-banner.jpg"
                                    className={inputCls}
                                />
                                {bannerUrl && (
                                    <div className="mt-4 relative rounded-xl overflow-hidden border border-neutral-200 h-32 w-full group">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={bannerUrl} alt="Banner Preview" className="h-full w-full object-cover" />
                                        <div className="absolute inset-0 bg-neutral-900/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <p className="text-xs font-bold text-neutral-900">Previsão da Imagem</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div>
                            <label className={labelCls}>Logotipo da Organização (Opcional)</label>
                            <div className="space-y-4">
                                <div className="p-4 border border-dashed border-neutral-300 rounded-2xl bg-neutral-50 hover:bg-neutral-50 transition-colors relative overflow-hidden">
                                    <input 
                                        type="file" 
                                        accept="image/png, image/jpeg, image/jpg, image/webp" 
                                        onChange={(e) => handleFileUpload(e, setLogoUrl)} 
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                        title="Clique ou arraste a imagem do seu computador"
                                    />
                                    <div className="flex flex-col items-center justify-center py-2 text-center pointer-events-none">
                                        <p className="text-sm font-bold text-neutral-900 mb-1">Upload do Logotipo</p>
                                        <p className="text-xs text-neutral-500">Fundo transparente (PNG) recomendado</p>
                                    </div>
                                </div>
                                <input
                                    type="url"
                                    value={logoUrl}
                                    onChange={(e) => setLogoUrl(e.target.value)}
                                    placeholder="https://exemplo.com/logotipo.png"
                                    className={inputCls}
                                />
                                {logoUrl && (
                                    <div className="mt-4 bg-white p-4 rounded-xl border border-neutral-200 inline-block">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={logoUrl} alt="Logo Preview" className="h-16 w-auto object-contain" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Custom HTML Landing Page */}
                    <div className="p-6 pb-4 flex items-center gap-3 border-t border-neutral-200 bg-neutral-50">
                        <LayoutTemplate className="h-5 w-5 text-emerald-600" />
                        <h2 className="text-sm font-bold text-emerald-600 tracking-widest uppercase">Layout da Landing Page</h2>
                    </div>

                    <div className="px-6 py-6 space-y-6 bg-neutral-50">
                        <label className="flex items-center gap-4 cursor-pointer group">
                            <div className="relative">
                                <input 
                                    type="checkbox" 
                                    checked={useCustomLandingPage} 
                                    onChange={e => setUseCustomLandingPage(e.target.checked)} 
                                    className="sr-only peer" 
                                />
                                <div className="w-12 h-6 bg-neutral-100 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 transition-colors shadow-inner" />
                            </div>
                            <div>
                                <span className="block text-sm font-bold text-neutral-800 group-hover:text-neutral-900 transition-colors">Substituir descrição simples por Layout Profissional (HTML)</span>
                                <span className="block text-xs text-neutral-500 mt-1">Permite criar tabelas, vídeos, divisões e texto formatado à medida usando código HTML.</span>
                            </div>
                        </label>
                        
                        {useCustomLandingPage && (
                            <div className="animate-in fade-in slide-in-from-top-2 pt-4 border-t border-neutral-200">
                                <label className={labelCls}>Código HTML da Landing Page</label>
                                <textarea
                                    rows={12}
                                    value={landingPageContent}
                                    onChange={e => setLandingPageContent(e.target.value)}
                                    placeholder="<div className='text-center'>\n  <h1 style='color: white;'>O Melhor Festival</h1>\n  <p>Descrição detalhada e formatações...</p>\n</div>"
                                    className={`${inputCls} font-mono text-xs leading-relaxed resize-y`}
                                    style={{ tabSize: 2 }}
                                />
                                <p className="mt-3 text-[11px] text-emerald-600/80 font-medium">
                                    Nota: O HTML será injetado diretamente na página. Poderá usar tags &lt;h1&gt;, &lt;strong&gt;, &lt;br&gt;, &lt;img&gt; ou estilos inline.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Ticket Template */}
                    <div className="p-6 pb-4 flex items-center gap-3 border-t border-neutral-200 bg-neutral-50">
                        <Ticket className="h-5 w-5 text-amber-500" />
                        <h2 className="text-sm font-bold text-amber-500 tracking-widest uppercase">Design de Bilhetes</h2>
                    </div>

                    <div className="px-6 py-6 space-y-4 bg-neutral-50 border-b border-neutral-200">
                        <label className={labelCls}>Template de Bilhetes PDF</label>
                        <select 
                            value={ticketTemplateId} 
                            onChange={e => setTicketTemplateId(e.target.value)} 
                            className={`${inputCls} appearance-none cursor-pointer`}
                        >
                            <option value="">Automático (Template principal da Organização)</option>
                            {templates.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                        <p className="mt-2 text-xs text-neutral-500">
                            Selecione o design específico para os bilhetes descarregados pelos compradores deste evento. Pode gerir designs na aba &quot;Bilhetes&quot; do menu principal.
                        </p>
                    </div>

                    {/* Footer Actions */}
                    <div className="px-6 py-6 bg-neutral-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <p className="text-[12px] text-neutral-500 font-medium">
                            As alterações refletem-se na página do evento logo após guardar.
                        </p>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-[14px] font-bold bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-md hover:-translate-y-0.5 active:scale-95 w-full sm:w-auto"
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

