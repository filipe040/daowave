"use client";

import { useEffect, useState, useCallback } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { DataTable } from "@/components/dashboard/DataTable";
import { getAuditLogs, AuditLog } from "@/lib/api-client";
import { ScrollText, RefreshCw } from "lucide-react";

const PAGE_LIMIT = 20;

const ACTION_COLOR: Record<string, string> = {
    CREATE: "bg-emerald-50 text-emerald-700",
    UPDATE: "bg-blue-50 text-blue-700",
    DELETE: "bg-red-50 text-red-600",
    LOGIN: "bg-gray-100 text-gray-500",
    APPROVE: "bg-purple-50 text-purple-700",
    BAN: "bg-red-50 text-red-600",
    PROMOTE: "bg-indigo-50 text-indigo-700",
};

export default function AdminAuditLogsPage() {
    const [data, setData] = useState<AuditLog[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [action, setAction] = useState("");
    const [entityType, setEntityType] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        const result = await getAuditLogs({
            page,
            limit: PAGE_LIMIT,
            ...(action && { action }),
            ...(entityType && { entityType }),
        });
        if (result.error || !result.data) setError(result.error ?? "Erro desconhecido");
        else { setData(result.data.data); setTotal(result.data.total); }
        setLoading(false);
    }, [page, action, entityType]);

    useEffect(() => { load(); }, [load]);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

    const refreshBtn = (
        <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
        >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Atualizar</span>
        </button>
    );

    const filters = (
        <div className="flex flex-wrap gap-2">
            <input
                className="text-sm border border-gray-200 bg-white text-gray-700 rounded-xl px-3 h-9 w-36 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                placeholder="Ação…"
                value={action}
                onChange={(e) => { setAction(e.target.value.toUpperCase()); setPage(1); }}
            />
            <input
                className="text-sm border border-gray-200 bg-white text-gray-700 rounded-xl px-3 h-9 w-36 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                placeholder="Entidade…"
                value={entityType}
                onChange={(e) => { setEntityType(e.target.value.toUpperCase()); setPage(1); }}
            />
            {refreshBtn}
        </div>
    );

    return (
        <PageShell
            title="Audit Logs"
            subtitle={`${total} registo${total !== 1 ? "s" : ""} de auditoria`}
            actions={filters}
        >
            <DataTable<AuditLog>
                keyField="id"
                data={data}
                loading={loading}
                error={error}
                onRetry={load}
                emptyIcon={ScrollText}
                emptyTitle="Sem registos"
                emptyDescription="Nenhum evento de auditoria encontrado para os filtros actuais."
                page={page}
                totalPages={totalPages}
                total={total}
                onPageChange={setPage}
                columns={[
                    {
                        key: "action",
                        label: "Ação",
                        render: (row) => (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${ACTION_COLOR[row.action] ?? "bg-gray-100 text-gray-500"}`}>
                                {row.action}
                            </span>
                        ),
                    },
                    {
                        key: "entityType",
                        label: "Entidade",
                        render: (row) => (
                            <span className="text-gray-700">{row.entityType}</span>
                        ),
                    },
                    {
                        key: "entityId",
                        label: "ID Entidade",
                        render: (row) => (
                            <span className="font-mono text-xs text-gray-400 truncate max-w-[140px] block">
                                {row.entityId ?? "—"}
                            </span>
                        ),
                    },
                    {
                        key: "actorUserId",
                        label: "Utilizador",
                        render: (row) => (
                            <span className="font-mono text-xs text-gray-400 truncate max-w-[140px] block">
                                {row.actorUserId}
                            </span>
                        ),
                    },
                    {
                        key: "createdAt",
                        label: "Data",
                        render: (row) => (
                            <span className="text-xs text-gray-400 whitespace-nowrap">
                                {new Date(row.createdAt).toLocaleString("pt-PT")}
                            </span>
                        ),
                    },
                ]}
            />
        </PageShell>
    );
}
