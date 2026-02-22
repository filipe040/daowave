"use client";

import { useEffect, useState, useCallback } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { toast } from "sonner";
import { Layers, Plus, ExternalLink, Archive, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TicketTemplateStatus, TicketTemplateLayout } from "@/lib/ticket-templates/models";

interface Template {
    id: string;
    name: string;
    status: TicketTemplateStatus;
    layout: TicketTemplateLayout;
    version: number;
    createdAt: string;
}

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
                body: JSON.stringify({ name: "Novo Template", layout: "A4_CLASSIC" }),
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
            subtitle="Personalize o visual dos seus bilhetes PDF"
            actions={
                <button
                    onClick={handleCreate}
                    disabled={creating || loading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-white text-black hover:bg-gray-100 disabled:opacity-50 transition-all"
                >
                    <Plus className="h-4 w-4" />
                    {creating ? "A criar..." : "Novo Template"}
                </button>
            }
        >
            {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-48 w-full rounded-2xl bg-white/5" />
                    ))}
                </div>
            )}

            {!loading && error && <ErrorState message={error} onRetry={load} />}

            {!loading && !error && templates.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                        <Layers className="h-8 w-8 text-white/20" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Sem templates</h3>
                    <p className="text-white/40 max-w-xs mt-2">
                        Ainda não criou nenhum template personalizado. Comece por criar um novo.
                    </p>
                    <button
                        onClick={handleCreate}
                        className="mt-6 text-sm font-bold text-white hover:text-white/80 transition-colors"
                    >
                        Criar o primeiro template →
                    </button>
                </div>
            )}

            {!loading && !error && templates.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map((template) => (
                        <Link
                            key={template.id}
                            href={`/promotor/settings/tickets/${template.id}`}
                            className="group bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.08] hover:border-white/20 transition-all"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`
                  px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5
                  ${template.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' :
                                        template.status === 'ARCHIVED' ? 'bg-white/5 text-white/30' : 'bg-amber-500/10 text-amber-500'}
                `}>
                                    {template.status === 'ACTIVE' ? <CheckCircle2 className="h-3 w-3" /> :
                                        template.status === 'ARCHIVED' ? <Archive className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                                    {template.status === 'ACTIVE' ? 'Ativo' :
                                        template.status === 'ARCHIVED' ? 'Arquivado' : 'Rascunho'}
                                </div>
                                <div className="text-[11px] font-bold text-white/20">v{template.version}</div>
                            </div>

                            <h3 className="text-base font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">
                                {template.name}
                            </h3>
                            <p className="text-xs text-white/40 mb-6">
                                Layout: {template.layout.replace('_', ' ')}
                            </p>

                            <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                                <span className="text-[11px] text-white/20">
                                    {new Date(template.createdAt).toLocaleDateString('pt-PT')}
                                </span>
                                <span className="text-xs font-bold text-white/60 flex items-center gap-1">
                                    Editar <ExternalLink className="h-3 w-3" />
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </PageShell>
    );
}
