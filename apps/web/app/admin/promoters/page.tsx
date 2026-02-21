"use client";

import { useEffect, useState, useCallback } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { DataTable } from "@/components/dashboard/DataTable";
import { Users, CheckCircle2, XCircle, Search } from "lucide-react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { toast } from "sonner";

interface PromoterProfile {
    id: string;
    brandName: string | null;
    contactEmail: string | null;
    status: string;
    createdAt: string;
    user: { id: string; name: string | null; email: string };
    _count: { events: number };
}

interface PaginatedPromoters {
    data: PromoterProfile[];
    total: number;
    page: number;
    limit: number;
}

const STATUS_LABEL: Record<string, string> = {
    APPROVED: "Aprovado",
    PENDING: "Pendente",
    REJECTED: "Rejeitado",
};

const STATUS_COLOR: Record<string, string> = {
    APPROVED: "bg-emerald-50 text-emerald-700",
    PENDING: "bg-amber-50 text-amber-700",
    REJECTED: "bg-red-50 text-red-600",
};

const PAGE_LIMIT = 20;

export default function AdminPromotersPage() {
    const [data, setData] = useState<PromoterProfile[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState("ALL");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actioning, setActioning] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const params = new URLSearchParams({ page: String(page), limit: String(PAGE_LIMIT) });
            if (status !== "ALL") params.set("status", status);
            const res = await fetchWithTimeout(`/api/admin/promoters?${params}`);
            if (!res.ok) throw new Error(`Erro ${res.status}`);
            const json = await res.json() as PaginatedPromoters;
            setData(json.data ?? []);
            setTotal(json.total ?? 0);
        } catch (err: unknown) { setError(err instanceof Error ? err.message : "Erro"); }
        finally { setLoading(false); }
    }, [page, status]);

    useEffect(() => { load(); }, [load]);

    const updateStatus = async (id: string, newStatus: string) => {
        setActioning(id);
        try {
            const res = await fetchWithTimeout(`/api/admin/promoters/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({})) as { error?: string };
                throw new Error(body.error ?? `Erro ${res.status}`);
            }
            toast.success(newStatus === "APPROVED" ? "Promotor aprovado" : "Promotor rejeitado");
            await load();
        } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Erro"); }
        finally { setActioning(null); }
    };

    const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));
    const pendingCount = data.filter((p) => p.status === "PENDING").length;

    return (
        <PageShell
            title="Promotores"
            subtitle={`${total} promotor${total !== 1 ? "es" : ""}${pendingCount > 0 ? ` · ${pendingCount} pendente${pendingCount !== 1 ? "s" : ""}` : ""}`}
            actions={
                <select
                    className="text-sm border border-gray-200 bg-white text-gray-700 rounded-xl px-3 h-9 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                    value={status}
                    onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                >
                    <option value="ALL">Todos</option>
                    <option value="PENDING">Pendentes</option>
                    <option value="APPROVED">Aprovados</option>
                    <option value="REJECTED">Rejeitados</option>
                </select>
            }
        >
            <DataTable<PromoterProfile>
                keyField="id"
                data={data}
                loading={loading}
                error={error}
                onRetry={load}
                emptyIcon={Users}
                emptyTitle="Sem promotores"
                emptyDescription="Nenhum promotor encontrado para o filtro selecionado."
                page={page}
                totalPages={totalPages}
                total={total}
                onPageChange={setPage}
                columns={[
                    {
                        key: "brandName",
                        label: "Nome / Marca",
                        render: (p) => (
                            <div>
                                <div className="font-medium text-gray-900">{p.brandName ?? "— sem nome —"}</div>
                                <div className="text-xs text-gray-400">{p.user.name ?? p.user.email}</div>
                            </div>
                        ),
                    },
                    {
                        key: "email",
                        label: "Email",
                        render: (p) => (
                            <span className="text-sm text-gray-500">{p.user.email}</span>
                        ),
                    },
                    {
                        key: "events",
                        label: "Eventos",
                        render: (p) => (
                            <span className="text-sm text-gray-700 font-medium">{p._count.events}</span>
                        ),
                    },
                    {
                        key: "status",
                        label: "Estado",
                        render: (p) => (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_COLOR[p.status] ?? "bg-gray-100 text-gray-500"}`}>
                                {STATUS_LABEL[p.status] ?? p.status}
                            </span>
                        ),
                    },
                    {
                        key: "createdAt",
                        label: "Criado",
                        render: (p) => (
                            <span className="text-xs text-gray-400">
                                {new Date(p.createdAt).toLocaleDateString("pt-PT")}
                            </span>
                        ),
                    },
                ]}
                rowActions={(p) => (
                    <>
                        {p.status === "PENDING" && (
                            <>
                                <button
                                    disabled={actioning === p.id}
                                    onClick={() => updateStatus(p.id, "APPROVED")}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-40 transition-colors"
                                >
                                    <CheckCircle2 className="h-3 w-3" />
                                    Aprovar
                                </button>
                                <button
                                    disabled={actioning === p.id}
                                    onClick={() => updateStatus(p.id, "REJECTED")}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-40 transition-colors"
                                >
                                    <XCircle className="h-3 w-3" />
                                    Rejeitar
                                </button>
                            </>
                        )}
                        {p.status === "APPROVED" && (
                            <button
                                disabled={actioning === p.id}
                                onClick={() => updateStatus(p.id, "REJECTED")}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                            >
                                <XCircle className="h-3 w-3" />
                                Revogar
                            </button>
                        )}
                    </>
                )}
            />
        </PageShell>
    );
}
