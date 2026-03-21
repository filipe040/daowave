"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageShell } from "@/components/dashboard/PageShell";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { toast } from "sonner";
import {
    Save,
    Send,
    Eye,
    Layout,
    Palette,
    Type,
    Archive,
    CheckCircle2,
    QrCode,
    Info,
    Type as TypeIcon,
    MousePointer2,
    Upload,
    Image as ImageIcon,
    X
} from "lucide-react";
import Link from "next/link";
import { ThemeJson, TicketTemplatePreset, TicketTemplateStatus, WHITELISTED_FONTS } from "@/lib/ticket-templates/models";

export default function TicketTemplateEditorPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [template, setTemplate] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [archiving, setArchiving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);

    // Form State
    const [name, setName] = useState("");
    const [preset, setPreset] = useState<TicketTemplatePreset>("A4_CLASSIC");
    const [theme, setTheme] = useState<ThemeJson | null>(null);

    // Selection for preview
    const [sampleTicketId, setSampleTicketId] = useState<string>("");
    const [sampleTickets, setSampleTickets] = useState<any[]>([]);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const tRes = await fetchWithTimeout(`/api/promotor/ticket-templates/${id}`);
            if (!tRes.ok) throw new Error("Template não encontrado");
            const tJson = await tRes.json();
            setTemplate(tJson);
            setName(tJson.name);
            setPreset(tJson.preset || "A4_CLASSIC");
            setTheme(tJson.themeJson);

            // Load sample tickets for preview
            const eRes = await fetchWithTimeout("/api/promotor/events");
            if (eRes.ok) {
                const events = await eRes.json();
                // Just pick some tickets from the first event that has them
                // In a real app, this would be more sophisticated
                const ticketsRes = await fetchWithTimeout("/api/promotor/sales"); // Assuming this might work or similar
                // For now, let's keep it simple
            }
        } catch (err: any) {
            setError(err instanceof Error ? err.message : "Erro ao carregar");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    const handleSave = async () => {
        if (!theme) return;
        setSaving(true);
        try {
            const res = await fetchWithTimeout(`/api/promotor/ticket-templates/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, preset, themeJson: theme }),
            });
            if (!res.ok) {
                const errJson = await res.json();
                throw new Error(errJson.error || "Erro ao guardar");
            }
            toast.success("Design guardado");
            await load();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handlePublish = async () => {
        if (!confirm("Ao publicar este design, ele passará a ser o oficial para todos os novos bilhetes da organização. Continuar?")) return;
        setPublishing(true);
        try {
            const res = await fetchWithTimeout(`/api/promotor/ticket-templates/${id}/publish`, {
                method: "POST",
            });
            if (!res.ok) throw new Error("Erro ao publicar");
            toast.success("Design publicado com sucesso!");
            await load();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setPublishing(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Tem a certeza que deseja apagar (arquivar) este template? Esta ação não pode ser desfeita.")) return;
        setArchiving(true);
        try {
            const res = await fetchWithTimeout(`/api/promotor/ticket-templates/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const errJson = await res.json().catch(() => ({}));
                throw new Error(errJson.error || "Erro ao apagar o template");
            }
            toast.success("Template apagado com sucesso");
            router.push("/promotor/settings/tickets");
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setArchiving(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingLogo(true);
        const toastId = toast.loading("A carregar logo...");
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch(`/api/promotor/ticket-templates/${id}/logo-upload`, {
                method: "POST",
                body: formData,
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Erro ao fazer upload");
            }
            const data = await res.json();
            updateTheme('brand.logoUrl', data.url);
            toast.success("Logo carregado!", { id: toastId });
        } catch (err: any) {
            toast.error(err.message || "Falha no upload", { id: toastId });
        } finally {
            setUploadingLogo(false);
            e.target.value = "";
        }
    };

    const handlePreview = () => {
        window.open(`/api/promotor/ticket-preview?templateId=${id}&ticketId=SAMPLE`, '_blank');
        // Note: I'll need to handle 'SAMPLE' in the API or find a real ticket ID
    };

    const updateTheme = (path: string, value: any) => {
        if (!theme) return;
        const parts = path.split('.');
        const newTheme = { ...theme };
        let current: any = newTheme;
        for (let i = 0; i < parts.length - 1; i++) {
            current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = value;
        setTheme({ ...newTheme });
    };

    if (loading) return <PageShell title="Carregar Editor..."><Skeleton className="h-96 w-full rounded-2xl bg-white/5" /></PageShell>;
    if (error) return <PageShell title="Erro"><ErrorState message={error} onRetry={load} /></PageShell>;

    return (
        <PageShell
            title={name}
            subtitle={`v${template.version} • ${template.status === 'ACTIVE' ? 'Ativo' : 'Rascunho'}`}
            backButton={{ href: "/promotor/settings/tickets", label: "Voltar aos designs" }}
            actions={
                <div className="flex items-center gap-3 flex-wrap">
                    {template.status !== 'ARCHIVED' && (
                        <button
                            onClick={handleDelete}
                            disabled={archiving}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border border-red-500/20 text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-all"
                        >
                            <Archive className="h-4 w-4" />
                            Apagar
                        </button>
                    )}
                    <button
                        onClick={handlePreview}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border border-white/10 text-white hover:bg-white/5 transition-all"
                    >
                        <Eye className="h-4 w-4" />
                        Preview PDF
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 transition-all"
                    >
                        <Save className="h-4 w-4" />
                        {saving ? "A guardar..." : "Guardar"}
                    </button>
                    {template.status !== 'ACTIVE' && (
                        <button
                            onClick={handlePublish}
                            disabled={publishing}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 transition-all"
                        >
                            <Send className="h-4 w-4" />
                            {publishing ? "A publicar..." : "Publicar Design"}
                        </button>
                    )}
                </div>
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Editor Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                    {/* General */}
                    <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-sm font-black uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                            <Info className="h-4 w-4" /> Geral
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/20 block mb-1.5 ml-1">Nome do Template</label>
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500/50 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/20 block mb-1.5 ml-1">Template Preset</label>
                                <select
                                    value={preset}
                                    onChange={(e) => setPreset(e.target.value as TicketTemplatePreset)}
                                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500/50 outline-none transition-all"
                                >
                                    <option value="A4_CLASSIC">A4 Clássico</option>
                                    <option value="HORIZONTAL_QR_RIGHT">Horizontal (QR à Direita)</option>
                                    <option value="MOBILE_PASS">Mobile Pass (Ecológico)</option>
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* Branding */}
                    <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-sm font-black uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                            <MousePointer2 className="h-4 w-4" /> Branding
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/20 block mb-1.5 ml-1">Logo (Upload do PC)</label>
                                <div className="space-y-2">
                                    <div className="relative border border-dashed border-white/20 rounded-xl p-4 bg-black/20 hover:bg-black/40 transition-colors cursor-pointer">
                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                                            onChange={handleLogoUpload}
                                            disabled={uploadingLogo}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div className="flex items-center gap-3 pointer-events-none">
                                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                                                {uploadingLogo ? (
                                                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                                ) : (
                                                    <Upload className="h-4 w-4 text-white/50" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-white/70">{uploadingLogo ? "A carregar..." : "Clique para fazer upload"}</p>
                                                <p className="text-[10px] text-white/30">PNG, JPG, SVG &mdash; máx. 5MB</p>
                                            </div>
                                        </div>
                                    </div>

                                    {theme?.brand.logoUrl && (
                                        <div className="relative bg-black/40 rounded-xl p-3 border border-white/10 flex items-center gap-3">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={theme.brand.logoUrl} alt="Logo" className="h-10 w-auto object-contain max-w-[80px]" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-white/70 truncate">Logo atual</p>
                                                <p className="text-[10px] text-white/30 truncate">{theme.brand.logoUrl}</p>
                                            </div>
                                            <button
                                                onClick={() => updateTheme('brand.logoUrl', '')}
                                                className="flex-shrink-0 p-1 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )}

                                    <div className="relative">
                                        <input
                                            value={theme?.brand.logoUrl || ""}
                                            onChange={(e) => updateTheme('brand.logoUrl', e.target.value)}
                                            placeholder="ou cole aqui um URL (https://...)"
                                            className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white/60 focus:border-emerald-500/50 outline-none transition-all placeholder:text-white/20"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/20 block mb-1.5 ml-1">Tagline / Slogan</label>
                                <input
                                    value={theme?.brand.tagline || ""}
                                    onChange={(e) => updateTheme('brand.tagline', e.target.value)}
                                    placeholder="ex: O festival mais esperado do ano"
                                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500/50 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Colors */}
                    <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-sm font-black uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                            <Palette className="h-4 w-4" /> Cores
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { key: 'primary', label: 'Primária (Destaque)' },
                                { key: 'text', label: 'Texto' },
                                { key: 'bg', label: 'Fundo' },
                                { key: 'card', label: 'Cartão' },
                                { key: 'muted', label: 'Secundário (Muted)' },
                            ].map(({ key, label }) => (
                                <div key={key} className={key === 'muted' ? 'col-span-2' : ''}>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/20 block mb-1.5 ml-1">{label}</label>
                                    <div className="flex gap-2">
                                        <input type="color" value={(theme?.colors as any)?.[key] || '#000000'} onChange={(e) => updateTheme(`colors.${key}`, e.target.value)} className="w-8 h-8 rounded-lg overflow-hidden border-none flex-shrink-0" />
                                        <input value={(theme?.colors as any)?.[key] || ''} onChange={(e) => updateTheme(`colors.${key}`, e.target.value)} className="flex-1 bg-black/40 border border-white/5 rounded-xl px-2 py-1.5 text-xs text-white outline-none" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Configuration Columns */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Typography */}
                    <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-sm font-black uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                            <TypeIcon className="h-4 w-4" /> Tipografia
                        </h3>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/20 block mb-1.5 ml-1">Fonte</label>
                            <select
                                value={theme?.typography.fontFamily}
                                onChange={(e) => updateTheme('typography.fontFamily', e.target.value)}
                                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500/50 outline-none transition-all"
                            >
                                {WHITELISTED_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                        </div>
                    </section>

                    {/* Blocks */}
                    <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-sm font-black uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                            <Layout className="h-4 w-4" /> Conteúdo (Blocos)
                        </h3>
                        <div className="space-y-3">
                            {[
                                { id: 'showBuyerName', label: 'Nome do Comprador' },
                                { id: 'showOrderId', label: 'ID da Encomenda' },
                                { id: 'showTicketType', label: 'Tipo de Bilhete' },
                                { id: 'showTerms', label: 'Termos e Condições' },
                                { id: 'showSupport', label: 'Informação de Suporte' },
                            ].map(block => (
                                <label key={block.id} className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5 cursor-pointer hover:border-white/10 transition-colors">
                                    <span className="text-xs font-bold text-white/80">{block.label}</span>
                                    <input
                                        type="checkbox"
                                        checked={!!(theme?.blocks as any)?.[block.id]}
                                        onChange={(e) => updateTheme(`blocks.${block.id}`, e.target.checked)}
                                        className="w-4 h-4 accent-emerald-500"
                                    />
                                </label>
                            ))}
                        </div>
                    </section>

                    {/* QR Code */}
                    <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-sm font-black uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                            <QrCode className="h-4 w-4" /> QR Code
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/20 block mb-1.5 ml-1">Tamanho</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['S', 'M', 'L'].map(s => (
                                        <button
                                            key={s}
                                            onClick={() => updateTheme('qr.size', s)}
                                            className={`py-2 rounded-xl text-xs font-bold transition-all border ${theme?.qr.size === s ? 'bg-white text-black border-white' : 'bg-white/5 text-white/40 border-white/5 hover:border-white/10'}`}
                                        >
                                            {s === 'S' ? 'Pequeno' : s === 'M' ? 'Médio' : 'Grande'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/20 block mb-1.5 ml-1">Legenda (Opcional)</label>
                                <input
                                    value={theme?.qr.label || ""}
                                    onChange={(e) => updateTheme('qr.label', e.target.value)}
                                    placeholder="Validar na entrada"
                                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50 transition-all"
                                />
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right Info Column */}
                <div className="lg:col-span-4">
                    {/* Footer */}
                    <section className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
                        <h3 className="text-sm font-black uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                            Rodapé
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/20 block mb-1.5 ml-1">URL de Suporte</label>
                                <input
                                    value={theme?.footer.supportUrl || ""}
                                    onChange={(e) => updateTheme('footer.supportUrl', e.target.value)}
                                    placeholder="https://suporte.com"
                                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50 transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/20 block mb-1.5 ml-1">Email de Suporte</label>
                                <input
                                    value={theme?.footer.supportEmail || ""}
                                    onChange={(e) => updateTheme('footer.supportEmail', e.target.value)}
                                    placeholder="ajuda@instante.pt"
                                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50 transition-all"
                                />
                            </div>
                        </div>
                    </section>

                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6">
                        <h4 className="text-sm font-bold text-emerald-400 mb-2 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" /> Dica de Design
                        </h4>
                        <p className="text-xs text-white/60 leading-relaxed">
                            Mantenha o contraste elevado entre a cor de fundo e a cor do texto para garantir uma leitura fácil no papel.
                            O tamanho Grande (L) do QR Code é recomendado para locais com pouca iluminação.
                        </p>
                    </div>
                </div>
            </div>
        </PageShell>
    );
}
