"use client";

import { useEffect, useState } from "react";

type FraudData = {
  duplicateCheckinsByTicket: number;
  duplicateCheckinsSample: { ticketId: string; _count: { id: number } }[];
  anomalousUsers: { userId: string; ordersInOneHour: number }[];
};

export default function FraudContent() {
  const [data, setData] = useState<FraudData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/fraud?limit=50")
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao carregar indicadores de fraude");
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="w-full min-w-0 max-w-7xl mx-auto space-y-6 sm:space-y-8 px-2 sm:px-4 md:px-6 lg:px-8">
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold">Anti-fraude</h1>
        <p className="text-base text-zinc-400">Check-ins duplicados e padrões de ordens anómalos</p>
      </div>
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-400">
          {error}
        </div>
      )}
      {loading ? (
        <div className="text-zinc-400 py-8">A carregar...</div>
      ) : data ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-800/60 rounded-2xl border border-zinc-700/50 p-6">
              <div className="text-sm text-zinc-400 mb-2">Bilhetes com check-in duplicado</div>
              <div className="text-3xl font-bold text-amber-400">{data.duplicateCheckinsByTicket}</div>
              <p className="text-xs text-zinc-500 mt-2">Possível reutilização de QR em modo SINGLE</p>
            </div>
            <div className="bg-zinc-800/60 rounded-2xl border border-zinc-700/50 p-6">
              <div className="text-sm text-zinc-400 mb-2">Utilizadores com ≥5 ordens/hora</div>
              <div className="text-3xl font-bold text-amber-400">{data.anomalousUsers?.length ?? 0}</div>
              <p className="text-xs text-zinc-500 mt-2">Padrão anómalo de compra</p>
            </div>
          </div>
          {data.duplicateCheckinsSample && data.duplicateCheckinsSample.length > 0 && (
            <div className="bg-zinc-800/60 rounded-2xl border border-zinc-700/50 overflow-hidden">
              <div className="p-4 border-b border-zinc-700/50 font-semibold">Amostra de bilhetes com check-ins duplicados</div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-900/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-300">Bilhete ID</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-zinc-300">N.º check-ins</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-700/50">
                    {data.duplicateCheckinsSample.map((row) => (
                      <tr key={row.ticketId} className="hover:bg-zinc-800/30">
                        <td className="px-4 py-3 font-mono text-sm">{row.ticketId}</td>
                        <td className="px-4 py-3 text-right">{row._count.id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {data.anomalousUsers && data.anomalousUsers.length > 0 && (
            <div className="bg-zinc-800/60 rounded-2xl border border-zinc-700/50 overflow-hidden">
              <div className="p-4 border-b border-zinc-700/50 font-semibold">Utilizadores com muitas ordens na mesma hora</div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-900/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-300">User ID</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-zinc-300">Ord. na hora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-700/50">
                    {data.anomalousUsers.map((row) => (
                      <tr key={row.userId} className="hover:bg-zinc-800/30">
                        <td className="px-4 py-3 font-mono text-sm">{row.userId}</td>
                        <td className="px-4 py-3 text-right">{row.ordersInOneHour}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {data.duplicateCheckinsByTicket === 0 && (!data.anomalousUsers || data.anomalousUsers.length === 0) && (
            <div className="text-center py-12 text-zinc-400">Nenhum indicador de fraude detetado no momento.</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
