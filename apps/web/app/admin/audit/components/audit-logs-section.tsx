"use client";

import { useEffect, useState } from "react";

type AuditLogEntry = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorUserId: string | null;
  metaJson: string | null;
  createdAt: string;
};

export default function AuditLogsSection() {
  const [data, setData] = useState<{ data: AuditLogEntry[]; total: number; page: number; limit: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const limit = 20;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (action) params.set("action", action);
    if (entityType) params.set("entityType", entityType);
    fetch(`/api/admin/audit-logs?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao carregar audit logs");
        return res.json();
      })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [page, action, entityType]);

  return (
    <div className="bg-zinc-800/60 rounded-2xl border border-zinc-700/50 overflow-hidden">
      <div className="p-6 border-b border-zinc-700/50 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">Audit Log (ações)</h2>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Ação"
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
            className="bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm w-32"
          />
          <input
            type="text"
            placeholder="Tipo entidade"
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value);
              setPage(1);
            }}
            className="bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm w-32"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        {loading ? (
          <div className="px-6 py-8 text-zinc-400">A carregar...</div>
        ) : data ? (
          <>
            <table className="w-full">
              <thead className="bg-zinc-900/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">Data</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">Ação</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">Tipo</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">ID entidade</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">Actor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-700/50">
                {data.data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-zinc-400">
                      Nenhum registo de auditoria
                    </td>
                  </tr>
                ) : (
                  data.data.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-800/30">
                      <td className="px-6 py-4 text-sm text-zinc-300">
                        {new Date(log.createdAt).toLocaleString("pt-PT")}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">{log.action}</td>
                      <td className="px-6 py-4 text-sm text-zinc-400">{log.entityType}</td>
                      <td className="px-6 py-4 font-mono text-xs text-zinc-500">{log.entityId}</td>
                      <td className="px-6 py-4 font-mono text-xs text-zinc-500">{log.actorUserId ?? "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="flex items-center justify-between px-6 py-3 border-t border-zinc-700/50 text-sm text-zinc-400">
              <span>{data.total} resultado(s) • página {data.page}</span>
              <div className="flex gap-2">
                <button
                  disabled={data.page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 rounded bg-zinc-700 disabled:opacity-50 hover:bg-zinc-600"
                >
                  Anterior
                </button>
                <button
                  disabled={data.page * data.limit >= data.total}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded bg-zinc-700 disabled:opacity-50 hover:bg-zinc-600"
                >
                  Seguinte
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
