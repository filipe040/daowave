"use client";

import { useEffect, useState, useCallback } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { DataTable } from "@/components/dashboard/DataTable";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { Building2, Check, X } from "lucide-react";
import { getAdminOrganizations, Organization } from "@/lib/api-client";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { toast } from "sonner";

const ORG_STATUS_COLOR: Record<string, string> = {
    ACTIVE: "bg-emerald-50 text-emerald-700",
    PENDING: "bg-amber-50 text-amber-700",
    REJECTED: "bg-red-50 text-red-600",
    SUSPENDED: "bg-gray-100 text-gray-500",
};

const ORG_STATUS_LABEL: Record<string, string> = {
    ACTIVE: "Ativa",
    PENDING: "Pendente",
    REJECTED: "Rejeitada",
    SUSPENDED: "Suspensa",
};

const PAGE_LIMIT = 20;

export default function AdminOrganizationsPage() {
    const [data, setData] = useState<Organization[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState("ALL");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actioning, setActioning] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        const result = await getAdminOrganizations({
            page,
            ...(status !== "ALL" && { status }),
        });
        if (result.error || !result.data) setError(result.error ?? "Erro desconhecido");
        else { setData(result.data.organizations ?? []); setTotal(result.data.total); }
        setLoading(false);
    }, [page, status]);

    useEffect(() => { load(); }, [load]);

    const handleApprove = async (id: string) => {
        setActioning(id);
        try {
            const res = await fetchWithTimeout(`/api/admin/organizations/${id}/approve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "ACTIVE" }),
            });
            if (!res.ok) throw new Error(`Erro ${res.status}`);
            toast.success("Organização aprovada");
            await load();
        } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Erro"); }
        finally { setActioning(null); }
    };

    const handleReject = async (id: string) => {
        setActioning(id);
        try {
            const res = await fetchWithTimeout(`/api/admin/organizations/${id}/approve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "REJECTED" }),
            });
            if (!res.ok) throw new Error(`Erro ${res.status}`);
            toast.success("Organização rejeitada");
            await load();
        } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Erro"); }
        finally { setActioning(null); }
    };

    const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

    return (
        <PageShell
            title="Organizações"
            subtitle={`${total} organização${total !== 1 ? "ões" : ""}`}
            actions={
                <select
                    className="text-sm border border-gray-200 bg-white text-gray-700 rounded-xl px-3 h-9 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                    value={status}
                    onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                >
                    <option value="ALL">Todas</option>
                    <option value="PENDING">Pendentes</option>
                    <option value="ACTIVE">Ativas</option>
                    <option value="REJECTED">Rejeitadas</option>
                    <option value="SUSPENDED">Suspensas</option>
                </select>
            }
        >
            {!loading && error ? (
                <ErrorState message={error} onRetry={load} />
            ) : (
                <DataTable<Organization>
                    keyField="id"
                    data={data}
                    loading={loading}
                    error={error}
                    onRetry={load}
                    emptyIcon={Building2}
                    emptyTitle="Sem organizações"
                    emptyDescription="Nenhuma organização encontrada."
                    page={page}
                    totalPages={totalPages}
                    total={total}
                    onPageChange={setPage}
                    columns={[
                        {
                            key: "name",
                            label: "Nome",
                            render: (org) => (
                                <div>
                                    <div className="font-medium text-gray-900">{org.name}</div>
                                    <div className="text-xs text-gray-400">{org.slug}</div>
                                </div>
                            ),
                        },
                        {
                            key: "status",
                            label: "Estado",
                            render: (org) => (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${ORG_STATUS_COLOR[org.status] ?? "bg-gray-100 text-gray-500"}`}>
                                    {ORG_STATUS_LABEL[org.status] ?? org.status}
                                </span>
                            ),
                        },
                        {
                            key: "createdAt",
                            label: "Criada",
                            render: (org) => (
                                <span className="text-xs text-gray-400">
                                    {new Date(org.createdAt).toLocaleDateString("pt-PT")}
                                </span>
                            ),
                        },
                    ]}
                    rowActions={(org) => (
                        <>
                            {org.status === "PENDING" && (
                                <>
                                    <button
                                        disabled={actioning === org.id}
                                        onClick={() => handleApprove(org.id)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-40 transition-colors"
                                    >
                                        <Check className="h-3 w-3" />
                                        Aprovar
                                    </button>
                                    <button
                                        disabled={actioning === org.id}
                                        onClick={() => handleReject(org.id)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-40 transition-colors"
                                    >
                                        <X className="h-3 w-3" />
                                        Rejeitar
                                    </button>
                                </>
                            )}
                        </>
                    )}
                />
            )}
        </PageShell>
    );
}
