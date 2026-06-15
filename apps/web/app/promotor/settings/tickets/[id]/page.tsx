"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
    MousePointer2,
    Upload,
    X,
    ChevronDown,
    Layers,
    Sparkles,
    FileText,
} from "lucide-react";
import { ThemeJson, TicketTemplatePreset, WHITELISTED_FONTS } from "@/lib/ticket-templates/models";
import { normalizeTicketTheme } from "@/lib/ticket-templates/default-theme";

type EditorTab = "geral" | "marca" | "visual" | "conteudo";

const TABS: { id: EditorTab; label: string; icon: typeof Info }[] = [
    { id: "geral", label: "Geral", icon: Info },
    { id: "marca", label: "Marca", icon: MousePointer2 },
    { id: "visual", label: "Visual", icon: Palette },
    { id: "conteudo", label: "Conteúdo", icon: FileText },
];

const sectionClass =
    "bg-[#0c0c12] border border-white/10/80 rounded-2xl shadow-sm overflow-hidden";
const sectionHeadClass =
    "flex items-center gap-2 px-4 sm:px-5 py-3.5 border-b border-white/10 bg-white/5/80";
const sectionBodyClass = "p-4 sm:p-5 space-y-4";
const labelClass = "text-[11px] font-bold uppercase tracking-wide text-zinc-500 block mb-2";
const inputClass =
    "w-full bg-[#0c0c12] border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-[#00a0e3]/50 focus:ring-2 focus:ring-[#00a0e3]/20 outline-none transition-all";
const selectClass = inputClass;

function Chip({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                active
                    ? "bg-[#00a0e3] text-white border-[#00a0e3] shadow-sm"
                    : "bg-[#14141f] text-zinc-400 border-white/10 hover:border-[#00a0e3]/30 hover:bg-[#00a0e3]/10/50"
            }`}
        >
            {children}
        </button>
    );
}

function Section({
    title,
    icon: Icon,
    children,
    defaultOpen = true,
}: {
    title: string;
    icon: typeof Info;
    children: React.ReactNode;
    defaultOpen?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className={sectionClass}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={`${sectionHeadClass} w-full text-left lg:cursor-default`}
            >
                <Icon className="h-4 w-4 text-[#00a0e3] shrink-0" />
                <span className="text-sm font-bold text-zinc-200 flex-1">{title}</span>
                <ChevronDown
                    className={`h-4 w-4 text-zinc-500 transition-transform lg:hidden ${open ? "rotate-180" : ""}`}
                />
            </button>
            <div className={`${sectionBodyClass} ${open ? "block" : "hidden lg:block"}`}>{children}</div>
        </div>
    );
}

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
    const [activeTab, setActiveTab] = useState<EditorTab>("geral");
    const [previewExpanded, setPreviewExpanded] = useState(true);

    const [name, setName] = useState("");
    const [preset, setPreset] = useState<TicketTemplatePreset>("A4_CLASSIC");
    const [theme, setTheme] = useState<ThemeJson | null>(null);

    const [previewHtml, setPreviewHtml] = useState("");
    const [previewLoading, setPreviewLoading] = useState(false);
    const previewDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

    const normalizeTheme = (raw: ThemeJson): ThemeJson => normalizeTicketTheme(raw);

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
            setTheme(normalizeTheme(tJson.themeJson));
        } catch (err: any) {
            setError(err instanceof Error ? err.message : "Erro ao carregar");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    const refreshPreview = useCallback(async (currentPreset: TicketTemplatePreset, currentTheme: ThemeJson) => {
        setPreviewLoading(true);
        try {
            const res = await fetch("/api/promotor/ticket-preview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    preset: currentPreset,
                    themeJson: currentTheme,
                    ticketId: "SAMPLE",
                }),
            });
            if (res.ok) setPreviewHtml(await res.text());
        } catch {
            /* preview opcional */
        } finally {
            setPreviewLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!theme) return;
        if (previewDebounce.current) clearTimeout(previewDebounce.current);
        previewDebounce.current = setTimeout(() => refreshPreview(preset, theme), 350);
        return () => {
            if (previewDebounce.current) clearTimeout(previewDebounce.current);
        };
    }, [preset, theme, refreshPreview]);

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
            const res = await fetchWithTimeout(`/api/promotor/ticket-templates/${id}/publish`, { method: "POST" });
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
            const res = await fetchWithTimeout(`/api/promotor/ticket-templates/${id}`, { method: "DELETE" });
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
            updateTheme("brand.logoUrl", data.url);
            toast.success("Logo carregado!", { id: toastId });
        } catch (err: any) {
            toast.error(err.message || "Falha no upload", { id: toastId });
        } finally {
            setUploadingLogo(false);
            e.target.value = "";
        }
    };

    const handlePreview = () => {
        if (!theme) return;
        fetch("/api/promotor/ticket-preview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ preset, themeJson: theme, ticketId: "SAMPLE" }),
        })
            .then(async (res) => {
                if (!res.ok) throw new Error("Erro ao gerar preview");
                const html = await res.text();
                const w = window.open("", "_blank");
                if (w) {
                    w.document.write(html);
                    w.document.close();
                }
            })
            .catch(() => toast.error("Não foi possível abrir o preview"));
    };

    const updateTheme = (path: string, value: unknown) => {
        if (!theme) return;
        setTheme((prev) => {
            if (!prev) return prev;
            const next = structuredClone(prev);
            const parts = path.split(".");
            let current: Record<string, unknown> = next as Record<string, unknown>;
            for (let i = 0; i < parts.length - 1; i++) {
                current = current[parts[i]] as Record<string, unknown>;
            }
            current[parts[parts.length - 1]] = value;
            return next;
        });
    };

    const updateLayout = (key: string, value: string) => {
        if (!theme) return;
        setTheme((prev) => {
            if (!prev) return prev;
            return normalizeTicketTheme({
                ...prev,
                layout: { ...(prev.layout || {}), [key]: value },
            });
        });
    };

    const Toggle = ({ id, label }: { id: string; label: string }) => (
        <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/5/80 border border-white/10 cursor-pointer hover:border-[#00a0e3]/30 hover:bg-[#00a0e3]/10/30 transition-colors">
            <span className="text-sm font-medium text-zinc-200">{label}</span>
            <input
                type="checkbox"
                checked={Boolean((theme?.blocks as Record<string, unknown>)?.[id])}
                onChange={(e) => updateTheme(`blocks.${id}`, e.target.checked)}
                className="w-4 h-4 accent-[#00a0e3] shrink-0"
            />
        </label>
    );

    const statusBadge =
        template?.status === "ACTIVE" ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <CheckCircle2 className="h-3 w-3" /> Ativo
            </span>
        ) : template?.status === "ARCHIVED" ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide bg-neutral-100 text-zinc-500">
                <Archive className="h-3 w-3" /> Arquivado
            </span>
        ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide bg-amber-50 text-amber-700 border border-amber-200/60">
                Rascunho
            </span>
        );

    const renderGeral = () => (
        <div className="space-y-4 sm:space-y-5">
            <Section title="Informações básicas" icon={Info}>
                <div>
                    <label className={labelClass}>Nome do template</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>Layout / preset</label>
                    <select
                        value={preset}
                        onChange={(e) => setPreset(e.target.value as TicketTemplatePreset)}
                        className={selectClass}
                    >
                        <option value="A4_CLASSIC">A4 Clássico — vertical, QR em baixo</option>
                        <option value="HORIZONTAL_QR_RIGHT">Horizontal — QR à direita</option>
                        <option value="MOBILE_PASS">Mobile Pass — estilo wallet</option>
                    </select>
                    <p className="text-xs text-zinc-500 mt-2">O preview atualiza ao mudar o preset.</p>
                </div>
            </Section>

            <Section title="Rodapé e suporte" icon={Layers}>
                <div>
                    <label className={labelClass}>URL de suporte</label>
                    <input
                        value={theme?.footer.supportUrl || ""}
                        onChange={(e) => updateTheme("footer.supportUrl", e.target.value)}
                        placeholder="https://suporte.com"
                        className={inputClass}
                    />
                </div>
                <div>
                    <label className={labelClass}>Email de suporte</label>
                    <input
                        value={theme?.footer.supportEmail || ""}
                        onChange={(e) => updateTheme("footer.supportEmail", e.target.value)}
                        placeholder="ajuda@exemplo.pt"
                        className={inputClass}
                    />
                </div>
            </Section>
        </div>
    );

    const renderMarca = () => (
        <div className="space-y-4 sm:space-y-5">
            <Section title="Logo e identidade" icon={MousePointer2}>
                <div>
                    <label className={labelClass}>Upload do logo</label>
                    <div className="relative border-2 border-dashed border-white/10 rounded-xl p-4 sm:p-5 bg-white/5 hover:border-[#00a0e3]/40 hover:bg-[#00a0e3]/10 transition-colors cursor-pointer">
                        <input
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                            onChange={handleLogoUpload}
                            disabled={uploadingLogo}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        />
                        <div className="flex items-center gap-3 pointer-events-none">
                            <div className="w-10 h-10 rounded-xl bg-[#0c0c12] border border-white/10 flex items-center justify-center shrink-0">
                                {uploadingLogo ? (
                                    <div className="w-4 h-4 border-2 border-[#00a0e3]/30 border-t-[#00a0e3] rounded-full animate-spin" />
                                ) : (
                                    <Upload className="h-4 w-4 text-[#00a0e3]" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-zinc-200">
                                    {uploadingLogo ? "A carregar..." : "Clique para fazer upload"}
                                </p>
                                <p className="text-xs text-zinc-500">PNG, JPG, SVG — máx. 5MB</p>
                            </div>
                        </div>
                    </div>
                </div>

                {theme?.brand.logoUrl && (
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={theme.brand.logoUrl} alt="Logo" className="h-10 w-auto object-contain max-w-[72px] shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-zinc-300">Logo atual</p>
                            <p className="text-[11px] text-zinc-500 truncate">{theme.brand.logoUrl}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => updateTheme("brand.logoUrl", "")}
                            className="p-2 rounded-lg hover:bg-[#14141f] text-zinc-500 hover:text-zinc-200 transition-colors shrink-0"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}

                <div>
                    <label className={labelClass}>URL do logo (alternativa)</label>
                    <input
                        value={theme?.brand.logoUrl || ""}
                        onChange={(e) => updateTheme("brand.logoUrl", e.target.value)}
                        placeholder="https://..."
                        className={inputClass}
                    />
                </div>

                <div>
                    <label className={labelClass}>Tagline / slogan</label>
                    <input
                        value={theme?.brand.tagline || ""}
                        onChange={(e) => updateTheme("brand.tagline", e.target.value)}
                        placeholder="O festival mais esperado do ano"
                        className={inputClass}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Tamanho do logo</label>
                        <select
                            value={theme?.brand.logoSize || "md"}
                            onChange={(e) => updateTheme("brand.logoSize", e.target.value)}
                            className={selectClass}
                        >
                            <option value="sm">Pequeno</option>
                            <option value="md">Médio</option>
                            <option value="lg">Grande</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Posição do logo</label>
                        <select
                            value={theme?.brand.logoPosition || "left"}
                            onChange={(e) => updateTheme("brand.logoPosition", e.target.value)}
                            className={selectClass}
                        >
                            <option value="left">Esquerda</option>
                            <option value="center">Centro</option>
                            <option value="right">Direita</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className={labelClass}>Estilo do cabeçalho</label>
                    <select
                        value={theme?.brand.headerStyle || "standard"}
                        onChange={(e) => updateTheme("brand.headerStyle", e.target.value)}
                        className={selectClass}
                    >
                        <option value="standard">Standard (logo + tagline)</option>
                        <option value="minimal">Minimal (sem tagline)</option>
                        <option value="bold">Bold (texto grande)</option>
                    </select>
                </div>

                <div>
                    <label className={labelClass}>Imagem de fundo do cartão (URL)</label>
                    <input
                        value={theme?.brand.backgroundUrl || ""}
                        onChange={(e) => updateTheme("brand.backgroundUrl", e.target.value)}
                        placeholder="https://... ou /uploads/..."
                        className={inputClass}
                    />
                </div>

                <div>
                    <label className={labelClass}>Marca de água (texto)</label>
                    <input
                        value={theme?.brand.watermarkText || ""}
                        onChange={(e) => updateTheme("brand.watermarkText", e.target.value)}
                        placeholder="ex: VIP"
                        maxLength={24}
                        className={inputClass}
                    />
                </div>
            </Section>
        </div>
    );

    const renderVisual = () => (
        <div className="space-y-4 sm:space-y-5">
            <Section title="Paleta de cores" icon={Palette}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                        { key: "primary", label: "Primária" },
                        { key: "accent", label: "Destaque / barra" },
                        { key: "text", label: "Texto" },
                        { key: "bg", label: "Fundo da página" },
                        { key: "card", label: "Fundo do cartão" },
                        { key: "muted", label: "Texto secundário" },
                        { key: "qrBackground", label: "Fundo do QR" },
                    ].map(({ key, label }) => (
                        <div key={key} className={key === "qrBackground" ? "sm:col-span-2" : ""}>
                            <label className={labelClass}>{label}</label>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="color"
                                    value={(theme?.colors as Record<string, string>)?.[key] || "#000000"}
                                    onChange={(e) => updateTheme(`colors.${key}`, e.target.value)}
                                    className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 cursor-pointer shrink-0"
                                />
                                <input
                                    value={(theme?.colors as Record<string, string>)?.[key] || ""}
                                    onChange={(e) => updateTheme(`colors.${key}`, e.target.value)}
                                    className={`${inputClass} font-mono text-xs`}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </Section>

            <Section title="Tipografia" icon={Type}>
                <div>
                    <label className={labelClass}>Fonte</label>
                    <select
                        value={theme?.typography.fontFamily}
                        onChange={(e) => updateTheme("typography.fontFamily", e.target.value)}
                        className={selectClass}
                    >
                        {WHITELISTED_FONTS.map((f) => (
                            <option key={f} value={f}>
                                {f}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Título do evento</label>
                        <select
                            value={theme?.typography.titleSize || "md"}
                            onChange={(e) => updateTheme("typography.titleSize", e.target.value)}
                            className={selectClass}
                        >
                            <option value="sm">Pequeno</option>
                            <option value="md">Médio</option>
                            <option value="lg">Grande</option>
                            <option value="xl">Extra grande</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Texto geral</label>
                        <select
                            value={theme?.typography.bodySize || "md"}
                            onChange={(e) => updateTheme("typography.bodySize", e.target.value)}
                            className={selectClass}
                        >
                            <option value="sm">Pequeno</option>
                            <option value="md">Médio</option>
                            <option value="lg">Grande</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className={labelClass}>Peso do título</label>
                    <div className="flex flex-wrap gap-2">
                        {(["semibold", "bold", "extrabold"] as const).map((w) => (
                            <Chip
                                key={w}
                                active={(theme?.typography.titleWeight || "bold") === w}
                                onClick={() => updateTheme("typography.titleWeight", w)}
                            >
                                {w === "semibold" ? "600" : w === "bold" ? "700" : "800"}
                            </Chip>
                        ))}
                    </div>
                </div>
                <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/5/80 border border-white/10 cursor-pointer">
                    <span className="text-sm font-medium text-zinc-200">Labels em maiúsculas</span>
                    <input
                        type="checkbox"
                        checked={theme?.typography.uppercaseLabels !== false}
                        onChange={(e) => updateTheme("typography.uppercaseLabels", e.target.checked)}
                        className="w-4 h-4 accent-[#00a0e3]"
                    />
                </label>
            </Section>

            <Section title="Estilo do cartão" icon={Layout}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Destaque superior</label>
                        <select
                            value={theme?.layout?.accentStyle || "bar"}
                            onChange={(e) => updateLayout("accentStyle", e.target.value)}
                            className={selectClass}
                        >
                            <option value="bar">Barra colorida</option>
                            <option value="gradient">Cabeçalho gradiente</option>
                            <option value="none">Sem destaque</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Estilo do cartão</label>
                        <select
                            value={theme?.layout?.cardStyle || "elevated"}
                            onChange={(e) => updateLayout("cardStyle", e.target.value)}
                            className={selectClass}
                        >
                            <option value="elevated">Com sombra</option>
                            <option value="bordered">Com borda colorida</option>
                            <option value="flat">Plano</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Largura</label>
                        <select
                            value={theme?.layout?.pageWidth || "standard"}
                            onChange={(e) => updateLayout("pageWidth", e.target.value)}
                            className={selectClass}
                        >
                            <option value="compact">Compacto</option>
                            <option value="standard">Standard</option>
                            <option value="wide">Largo</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Margem exterior</label>
                        <select
                            value={theme?.layout?.pagePadding || "md"}
                            onChange={(e) => updateLayout("pagePadding", e.target.value)}
                            className={selectClass}
                        >
                            <option value="none">Nenhuma</option>
                            <option value="sm">Pequena</option>
                            <option value="md">Média</option>
                            <option value="lg">Grande</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Separador</label>
                        <select
                            value={theme?.layout?.dividerStyle || "dashed"}
                            onChange={(e) => updateLayout("dividerStyle", e.target.value)}
                            className={selectClass}
                        >
                            <option value="dashed">Tracejado</option>
                            <option value="solid">Sólido</option>
                            <option value="dotted">Pontilhado</option>
                            <option value="none">Sem linha</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Padrão de fundo</label>
                        <select
                            value={theme?.layout?.backgroundPattern || "none"}
                            onChange={(e) => updateLayout("backgroundPattern", e.target.value)}
                            className={selectClass}
                        >
                            <option value="none">Nenhum</option>
                            <option value="dots">Pontos</option>
                            <option value="grid">Grelha</option>
                            <option value="diagonal">Diagonal</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className={labelClass}>Cantos arredondados</label>
                    <div className="flex flex-wrap gap-2">
                        {(["sm", "md", "lg"] as const).map((r) => (
                            <Chip
                                key={r}
                                active={(theme?.layout?.cornerRadius || "md") === r}
                                onClick={() => updateLayout("cornerRadius", r)}
                            >
                                {r === "sm" ? "Suave" : r === "md" ? "Médio" : "Forte"}
                            </Chip>
                        ))}
                    </div>
                </div>
                <div>
                    <label className={labelClass}>Alinhamento</label>
                    <div className="flex flex-wrap gap-2">
                        {(["left", "center"] as const).map((a) => (
                            <Chip
                                key={a}
                                active={(theme?.layout?.contentAlign || "left") === a}
                                onClick={() => updateLayout("contentAlign", a)}
                            >
                                {a === "left" ? "Esquerda" : "Centro"}
                            </Chip>
                        ))}
                    </div>
                </div>
            </Section>

            <Section title="QR Code" icon={QrCode}>
                <div>
                    <label className={labelClass}>Tamanho</label>
                    <div className="flex flex-wrap gap-2">
                        {(["S", "M", "L"] as const).map((s) => (
                            <Chip key={s} active={theme?.qr.size === s} onClick={() => updateTheme("qr.size", s)}>
                                {s === "S" ? "Pequeno" : s === "M" ? "Médio" : "Grande"}
                            </Chip>
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Moldura</label>
                        <select
                            value={theme?.qr.frameStyle || "light"}
                            onChange={(e) => updateTheme("qr.frameStyle", e.target.value)}
                            className={selectClass}
                        >
                            <option value="none">Sem moldura</option>
                            <option value="light">Sombra suave</option>
                            <option value="accent">Borda colorida</option>
                            <option value="bold">Destaque forte</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Cantos do QR</label>
                        <select
                            value={theme?.qr.borderRadius || "md"}
                            onChange={(e) => updateTheme("qr.borderRadius", e.target.value)}
                            className={selectClass}
                        >
                            <option value="none">Retos</option>
                            <option value="sm">Suaves</option>
                            <option value="md">Médios</option>
                            <option value="lg">Arredondados</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className={labelClass}>Legenda</label>
                    <input
                        value={theme?.qr.label || ""}
                        onChange={(e) => updateTheme("qr.label", e.target.value)}
                        placeholder="Validar na entrada"
                        className={inputClass}
                    />
                </div>
            </Section>
        </div>
    );

    const renderConteudo = () => (
        <div className="space-y-4 sm:space-y-5">
            <Section title="Blocos visíveis" icon={Layout} defaultOpen>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Toggle id="showEventTitle" label="Título do evento" />
                    <Toggle id="showVenue" label="Local" />
                    <Toggle id="showCity" label="Cidade" />
                    <Toggle id="showDate" label="Data e hora" />
                    <Toggle id="showTicketCode" label="Código do bilhete" />
                    <Toggle id="showOrganization" label="Organização" />
                    <Toggle id="showBuyerName" label="Comprador" />
                    <Toggle id="showTicketType" label="Tipo de bilhete" />
                    <Toggle id="showOrderId" label="ID encomenda" />
                    <Toggle id="showTerms" label="Termos" />
                    <Toggle id="showSupport" label="Suporte" />
                </div>
            </Section>

            <Section title="Textos personalizados" icon={Type}>
                <div>
                    <label className={labelClass}>Badge / etiqueta</label>
                    <input
                        value={theme?.blocks.badgeText || ""}
                        onChange={(e) => updateTheme("blocks.badgeText", e.target.value)}
                        placeholder="Bilhete Digital"
                        className={inputClass}
                    />
                </div>
                <div>
                    <label className={labelClass}>Texto legal</label>
                    <textarea
                        value={theme?.blocks.customTerms || ""}
                        onChange={(e) => updateTheme("blocks.customTerms", e.target.value)}
                        placeholder="Deixe vazio para o texto padrão..."
                        rows={3}
                        className={`${inputClass} resize-y min-h-[80px]`}
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    {[
                        { key: "labelBadge", label: "Badge", placeholder: "Bilhete Digital" },
                        { key: "labelVenue", label: "Local", placeholder: "Local" },
                        { key: "labelDate", label: "Data", placeholder: "Data e Hora" },
                        { key: "labelBuyer", label: "Titular", placeholder: "Titular" },
                        { key: "labelTicketType", label: "Tipo", placeholder: "Tipo de Bilhete" },
                        { key: "labelTicketCode", label: "Código", placeholder: "Código" },
                    ].map(({ key, label, placeholder }) => (
                        <div key={key}>
                            <label className={labelClass}>{label}</label>
                            <input
                                value={(theme?.copy as Record<string, string>)?.[key] || ""}
                                onChange={(e) => updateTheme(`copy.${key}`, e.target.value)}
                                placeholder={placeholder}
                                className={inputClass}
                            />
                        </div>
                    ))}
                </div>
            </Section>

            <div className="rounded-2xl border border-[#00a0e3]/30 bg-gradient-to-br from-[#00a0e3]/5 to-[#14141f] p-4 sm:p-5">
                <h4 className="text-sm font-bold text-[#5ec8f8] mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" /> Dica
                </h4>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                    Use contraste elevado entre fundo e texto. QR tamanho L funciona melhor em locais com pouca luz.
                </p>
            </div>
        </div>
    );

    const tabContent = () => {
        switch (activeTab) {
            case "marca":
                return renderMarca();
            case "visual":
                return renderVisual();
            case "conteudo":
                return renderConteudo();
            default:
                return renderGeral();
        }
    };

    const previewPanel = (
        <div className={`${sectionClass} flex flex-col`}>
            <div className={`${sectionHeadClass} justify-between`}>
                <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-[#00a0e3]" />
                    <span className="text-sm font-bold text-zinc-200">Preview ao vivo</span>
                </div>
                <div className="flex items-center gap-2">
                    {previewLoading && (
                        <span className="text-[11px] text-[#00a0e3] font-medium animate-pulse">A atualizar...</span>
                    )}
                    <button
                        type="button"
                        onClick={() => setPreviewExpanded((v) => !v)}
                        className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 text-zinc-500"
                        aria-label={previewExpanded ? "Recolher preview" : "Expandir preview"}
                    >
                        <ChevronDown className={`h-4 w-4 transition-transform ${previewExpanded ? "rotate-180" : ""}`} />
                    </button>
                </div>
            </div>
            <div className={`p-3 sm:p-4 ${previewExpanded ? "block" : "hidden lg:block"}`}>
                <div className="rounded-xl overflow-hidden border border-white/10 bg-neutral-900/5 shadow-inner min-h-[220px] h-[38vh] sm:h-[42vh] lg:h-[min(520px,calc(100vh-12rem))] xl:min-h-[480px]">
                    {previewHtml ? (
                        <iframe
                            title="Preview do bilhete"
                            srcDoc={previewHtml}
                            className="w-full h-full border-0 bg-white"
                            sandbox="allow-same-origin"
                        />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center gap-2 text-zinc-500">
                            <div className="w-8 h-8 border-2 border-[#00a0e3]/30 border-t-[#00a0e3] rounded-full animate-spin" />
                            <span className="text-sm">A carregar preview...</span>
                        </div>
                    )}
                </div>
                <p className="text-xs text-zinc-500 mt-3 leading-relaxed">
                    Alterações refletem-se aqui em tempo real. Guarde e publique para aplicar nos bilhetes.
                </p>
                <button
                    type="button"
                    onClick={handlePreview}
                    className="mt-3 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border border-white/10 text-zinc-200 hover:bg-white/5 transition-all"
                >
                    <Eye className="h-4 w-4" />
                    Abrir em ecrã completo
                </button>
            </div>
        </div>
    );

    if (loading) {
        return (
            <PageShell title="Editor de bilhetes">
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_minmax(300px,380px)] gap-6">
                    <Skeleton className="h-[480px] w-full rounded-2xl" />
                    <Skeleton className="h-[520px] w-full rounded-2xl hidden xl:block" />
                </div>
            </PageShell>
        );
    }

    if (error) {
        return (
            <PageShell title="Erro">
                <ErrorState message={error} onRetry={load} />
            </PageShell>
        );
    }

    return (
        <PageShell
            title={name || "Editor de bilhetes"}
            subtitle={
                <span className="flex flex-wrap items-center gap-2">
                    {statusBadge}
                    <span className="text-zinc-500">·</span>
                    <span>v{template.version}</span>
                </span>
            }
            backButton={{ href: "/promotor/settings/tickets", label: "Voltar aos designs" }}
            actions={
                <div className="hidden lg:flex items-center gap-2 flex-wrap">
                    {template.status !== "ARCHIVED" && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={archiving}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-all"
                        >
                            <Archive className="h-4 w-4" />
                            Apagar
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border border-white/10 bg-[#14141f] text-white hover:bg-white/5 disabled:opacity-50 transition-all shadow-sm"
                    >
                        <Save className="h-4 w-4" />
                        {saving ? "A guardar..." : "Guardar"}
                    </button>
                    {template.status !== "ACTIVE" && (
                        <button
                            type="button"
                            onClick={handlePublish}
                            disabled={publishing}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-[#00a0e3] text-white hover:bg-[#0090cc] disabled:opacity-50 transition-all shadow-sm"
                        >
                            <Send className="h-4 w-4" />
                            {publishing ? "A publicar..." : "Publicar"}
                        </button>
                    )}
                </div>
            }
        >
            <div className="pb-24 lg:pb-0">
                <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] gap-5 xl:gap-6 items-start">
                    {/* Preview — primeiro no mobile */}
                    <div className="order-1 xl:order-2 xl:sticky xl:top-4">{previewPanel}</div>

                    {/* Editor */}
                    <div className="order-2 xl:order-1 min-w-0 space-y-4">
                        {/* Tabs */}
                        <div className="sticky top-0 z-20 -mx-1 px-1 pt-1 pb-2 bg-gradient-to-b from-white via-white to-transparent">
                            <div
                                className="flex gap-1.5 overflow-x-auto no-scrollbar p-1.5 bg-neutral-100/80 border border-white/10/80 rounded-2xl backdrop-blur-sm"
                                role="tablist"
                            >
                                {TABS.map(({ id, label, icon: Icon }) => (
                                    <button
                                        key={id}
                                        type="button"
                                        role="tab"
                                        aria-selected={activeTab === id}
                                        onClick={() => setActiveTab(id)}
                                        className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all shrink-0 ${
                                            activeTab === id
                                                ? "bg-[#14141f] text-[#5ec8f8] shadow-sm border border-[#00a0e3]/20"
                                                : "text-zinc-400 hover:text-white hover:bg-[#14141f]/60"
                                        }`}
                                    >
                                        <Icon className="h-4 w-4 shrink-0" />
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {tabContent()}
                    </div>
                </div>
            </div>

            {/* Barra fixa mobile / tablet */}
            <div className="fixed bottom-0 inset-x-0 z-30 lg:hidden border-t border-white/10 bg-white/95 backdrop-blur-md px-4 py-3 safe-area-pb shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
                <div className="max-w-7xl mx-auto flex items-center gap-2">
                    {template.status !== "ARCHIVED" && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={archiving}
                            className="p-2.5 rounded-xl border border-red-200 text-red-600 shrink-0"
                            aria-label="Apagar"
                        >
                            <Archive className="h-5 w-5" />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border border-white/10 bg-[#14141f] text-white disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        {saving ? "A guardar..." : "Guardar"}
                    </button>
                    {template.status !== "ACTIVE" && (
                        <button
                            type="button"
                            onClick={handlePublish}
                            disabled={publishing}
                            className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-[#00a0e3] text-white disabled:opacity-50"
                        >
                            <Send className="h-4 w-4" />
                            {publishing ? "..." : "Publicar"}
                        </button>
                    )}
                </div>
            </div>
        </PageShell>
    );
}
