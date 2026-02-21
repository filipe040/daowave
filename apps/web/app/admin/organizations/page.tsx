"use client";

import { useEffect, useState, useCallback } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { DataTable } from "@/components/dashboard/DataTable";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { Building2, Plus, Users, Calendar, ArrowRight, ExternalLink } from "lucide-react";
import { getAdminOrganizations, Organization } from "@/lib/api-client";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

const ORG_STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
    ACTIVE: { label: "Ativa", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", dot: "bg-emerald-400" },
    PENDING: { label: "Pendente", color: "text-amber-400 bg-amber-400/10 border-amber-400/20", dot: "bg-amber-400" },
    REJECTED: { label: "Rejeitada", color: "text-rose-400 bg-rose-400/10 border-rose-400/20", dot: "bg-rose-400" },
    SUSPENDED: { label: "Suspensa", color: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20", dot: "bg-zinc-500" },
};

export default function AdminOrganizationsPage() {
    const [data, setData] = useState<Organization[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState("ALL");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getAdminOrganizations({
                page,
                limit: 10,
                ...(status !== "ALL" && { status }),
                q: search,
            });

            if (result.error || !result.data) {
                setError(result.error ?? "Erro ao carregar organizações");
            } else {
                setData(result.data.organizations ?? []);
                setTotal(result.data.pagination.total);
            }
        } catch (err) {
            setError("Falha na comunicação com o servidor");
        } finally {
            setLoading(false);
        }
    }, [page, status, search]);

    useEffect(() => {
        const timer = setTimeout(() => load(), 300);
        return () => clearTimeout(timer);
    }, [load]);

    const totalPages = Math.max(1, Math.ceil(total / 10));

    return (
        <PageShell
            title="Organizações"
            subtitle={`${total} entidade${total !== 1 ? "s" : ""} gerida${total !== 1 ? "s" : ""}`}
            actions={
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <select
                            className="appearance-none text-[13px] font-bold border border-white/5 bg-white/5 text-white/70 rounded-2xl px-4 pr-10 h-11 focus:outline-none focus:ring-2 focus:ring-white/10 hover:bg-white/10 transition-all cursor-pointer shadow-xl"
                            value={status}
                            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                        >
                            <option value="ALL">Todos os Estados</option>
                            <option value="PENDING">Pendentes</option>
                            <option value="ACTIVE">Ativas</option>
                            <option value="REJECTED">Rejeitadas</option>
                            <option value="SUSPENDED">Suspensas</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20 group-hover:text-white/40 transition-colors">
                            <ArrowRight className="h-3 w-3 rotate-90" />
                        </div>
                    </div>

                    <button
                        onClick={() => toast.info("Funcionalidade em desenvolvimento")}
                        className="flex items-center gap-2 px-5 h-11 bg-white text-black rounded-2xl text-[13px] font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-white/5"
                    >
                        <Plus className="h-4 w-4" strokeWidth={2.5} />
                        Nova Organização
                    </button>
                </div>
            }
        >
            <DataTable<Organization>
                keyField="id"
                data={data}
                loading={loading}
                error={error}
                onRetry={load}
                emptyIcon={Building2}
                emptyTitle="Sem organizações"
                emptyDescription="A sua pesquisa não devolveu resultados."
                page={page}
                totalPages={totalPages}
                total={total}
                onPageChange={setPage}
                columns={[
                    {
                        key: "name",
                        label: "Organização",
                        render: (org) => (
                            <Link href={`/admin/organizations/${org.id}`} className="group/item">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover/item:border-white/20 transition-all">
                                        <Building2 className="h-5 w-5 text-white/40 group-hover/item:text-white transition-colors" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-white group-hover/item:text-white transition-colors tracking-tight">
                                            {org.name}
                                        </div>
                                        <div className="text-[11px] font-medium text-white/30 uppercase tracking-widest mt-0.5">
                                            {org.slug}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ),
                    },
                    {
                        key: "status",
                        label: "Estado",
                        render: (org) => {
                            const config = ORG_STATUS_CONFIG[org.status] || ORG_STATUS_CONFIG.SUSPENDED;
                            return (
                                <div className={cn(
                                    "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold border shadow-sm",
                                    config.color
                                )}>
                                    <div className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
                                    {config.label}
                                </div>
                            );
                        },
                    },
                    {
                        key: "members",
                        label: "Equipa",
                        render: (org) => (
                            <div className="flex items-center gap-2 text-white/40">
                                <Users className="h-4 w-4" />
                                <span className="text-[13px] font-medium">{org._count?.members || 0}</span>
                            </div>
                        ),
                    },
                    {
                        key: "events",
                        label: "Eventos",
                        render: (org) => (
                            <div className="flex items-center gap-2 text-white/40">
                                <Calendar className="h-4 w-4" />
                                <span className="text-[13px] font-medium">{org._count?.events || 0}</span>
                            </div>
                        ),
                    },
                    {
                        key: "createdAt",
                        label: "Criada",
                        render: (org) => (
                            <span className="text-[13px] font-medium text-white/20">
                                {new Date(org.createdAt).toLocaleDateString("pt-PT")}
                            </span>
                        ),
                    },
                ]}
                rowActions={(org) => (
                    <Link
                        href={`/admin/organizations/${org.id}`}
                        className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/5 text-white/40 hover:bg-white hover:text-black transition-all group/action"
                    >
                        <ArrowRight className="h-4 w-4 transition-transform group-hover/action:translate-x-0.5" strokeWidth={2.5} />
                    </Link>
                )}
            />
        </PageShell>
    );
}
