"use client";

import { useEffect, useState, useCallback } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { toast } from "sonner";
import {
    Layers,
    Plus,
    ExternalLink,
    Archive,
    CheckCircle2,
    Clock,
    Ticket,
    LayoutTemplate,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TicketTemplateStatus, TicketTemplatePreset } from "@/lib/ticket-templates/models";

interface Template {
    id: string;
    name: string;
    status: TicketTemplateStatus;
    preset: TicketTemplatePreset;
    version: number;
    createdAt: string;
}

const PRESET_LABELS: Record<TicketTemplatePreset, string> = {
    A4_CLASSIC: "A4 Clássico",
    HORIZONTAL_QR_RIGHT: "Horizontal",
    MOBILE_PASS: "Mobile Pass",
};

export default function TicketTemplatesPage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const router = useRouter();

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetchWithTimeout("/api/promotor/ticket-templates");
            if (!res.ok) throw new Error(`Erro ${res.status}`);
            const json = await res.json();
            setTemplates(json);
        } catch (err: any) {
            setError(err instanceof Error ? err.message : "Erro ao carregar templates");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const handleCreate = async () => {
        setCreating(true);
        try {
            const res = await fetchWithTimeout("/api/promotor/ticket-templates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: "Novo Template", preset: "A4_CLASSIC" }),
            });
            if (!res.ok) throw new Error("Erro ao criar template");
            const newTemplate = await res.json();
            toast.success("Template criado com sucesso");
            router.push(`/promotor/settings/tickets/${newTemplate.id}`);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setCreating(false);
        }
    };

    return (
        <PageShell
            title="Design de Bilhetes"
            subtitle="Personalize o visual dos bilhetes PDF enviados aos compradores"
            actions={
                <button
                    onClick={handleCreate}
                    disabled={creating || loading}
                    className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-bold bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 transition-all shadow-sm"
                >
                    <Plus className="h-4 w-4" />
                    {creating ? "A criar..." : "Novo template"}
                </button>
            }
        >
            {loading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-52 w-full rounded-2xl" />
                    ))}
                </div>
            )}

            {!loading && error && <ErrorState message={error} onRetry={load} />}

            {!loading && !error && templates.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 sm:py-24 px-4 text-center rounded-3xl border border-dashed border-neutral-200 bg-gradient-to-b from-violet-50/50 to-white">
                    <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mb-5">
                        <Ticket className="h-8 w-8 text-violet-600" />
                    </div>
                    <h3 className="text-xl font-bold text-neutral-900">Sem templates ainda</h3>
                    <p className="text-neutral-500 max-w-md mt-2 text-sm sm:text-base leading-relaxed">
                        Crie o primeiro design personalizado para os bilhetes da sua organização — cores, logo, layout e QR.
                    </p>
                    <button
                        onClick={handleCreate}
                        disabled={creating}
                        className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-violet-600 text-white hover:bg-violet-700 transition-all shadow-sm"
                    >
                        <Plus className="h-4 w-4" />
                        Criar o primeiro template
                    </button>
                </div>
            )}

            {!loading && !error && templates.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                    {templates.map((template) => (
                        <Link
                            key={template.id}
                            href={`/promotor/settings/tickets/${template.id}`}
                            className="group flex flex-col bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-violet-200 transition-all active:scale-[0.99]"
                        >
                            <div className="flex justify-between items-start gap-3 mb-4">
                                <span
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide shrink-0 ${
                                        template.status === "ACTIVE"
                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                            : template.status === "ARCHIVED"
                                              ? "bg-neutral-100 text-neutral-500"
                                              : "bg-amber-50 text-amber-700 border border-amber-200/60"
                                    }`}
                                >
                                    {template.status === "ACTIVE" ? (
                                        <CheckCircle2 className="h-3 w-3" />
                                    ) : template.status === "ARCHIVED" ? (
                                        <Archive className="h-3 w-3" />
                                    ) : (
                                        <Clock className="h-3 w-3" />
                                    )}
                                    {template.status === "ACTIVE"
                                        ? "Ativo"
                                        : template.status === "ARCHIVED"
                                          ? "Arquivado"
                                          : "Rascunho"}
                                </span>
                                <span className="text-[11px] font-bold text-neutral-400">v{template.version}</span>
                            </div>

                            <div className="flex items-start gap-3 mb-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0 group-hover:bg-violet-100 transition-colors">
                                    <LayoutTemplate className="h-5 w-5 text-violet-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-base font-bold text-neutral-900 truncate group-hover:text-violet-700 transition-colors">
                                        {template.name}
                                    </h3>
                                    <p className="text-xs text-neutral-500 mt-0.5">
                                        {PRESET_LABELS[template.preset] || template.preset}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-auto flex items-center justify-between pt-4 border-t border-neutral-100">
                                <span className="text-[11px] text-neutral-400">
                                    {new Date(template.createdAt).toLocaleDateString("pt-PT")}
                                </span>
                                <span className="text-xs font-bold text-violet-600 flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                    Editar
                                    <ExternalLink className="h-3 w-3" />
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {!loading && !error && templates.length > 0 && (
                <div className="mt-8 rounded-2xl border border-neutral-200/80 bg-neutral-50/50 p-4 sm:p-5 flex gap-3 items-start">
                    <Layers className="h-5 w-5 text-violet-600 shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                        Apenas um template pode estar <strong className="font-semibold text-neutral-800">Ativo</strong> de
                        cada vez. Ao publicar um design, os bilhetes novos passam a usá-lo automaticamente.
                    </p>
                </div>
            )}
        </PageShell>
    );
}
