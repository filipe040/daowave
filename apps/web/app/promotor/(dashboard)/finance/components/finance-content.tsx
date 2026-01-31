"use client";

import { useEffect, useState } from "react";
import PromoterSidebar from "@/app/promotor/components/promoter-sidebar";

type FinanceData = {
  grossCents: number;
  currency: string;
  feesCents: number;
  netCents: number;
  payoutsPaidCents: number;
  payoutsPendingCents: number;
  payouts: { id: string; amountCents: number; status: string; createdAt: string }[];
};

export default function FinanceContent() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/promotor/finance")
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao carregar financeiro");
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex">
      <PromoterSidebar />
      <main className="flex-1 overflow-y-auto lg:ml-72 pt-12 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8 space-y-4">
          <h1 className="text-xl sm:text-2xl font-bold uppercase">Financeiro</h1>
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400">
              {error}
            </div>
          )}
          {loading ? (
            <div className="text-white/60 py-8">A carregar...</div>
          ) : data ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-zinc-900 border border-white/10 rounded-xl p-4">
                  <div className="text-xs text-white/60 uppercase mb-1">Receita bruta</div>
                  <div className="text-2xl font-bold">{(data.grossCents / 100).toFixed(2)} {data.currency}</div>
                </div>
                <div className="bg-zinc-900 border border-white/10 rounded-xl p-4">
                  <div className="text-xs text-white/60 uppercase mb-1">Líquido</div>
                  <div className="text-2xl font-bold">{(data.netCents / 100).toFixed(2)} {data.currency}</div>
                </div>
                <div className="bg-zinc-900 border border-white/10 rounded-xl p-4">
                  <div className="text-xs text-white/60 uppercase mb-1">Payouts pagos</div>
                  <div className="text-2xl font-bold text-green-400">{(data.payoutsPaidCents / 100).toFixed(2)} {data.currency}</div>
                </div>
                <div className="bg-zinc-900 border border-white/10 rounded-xl p-4">
                  <div className="text-xs text-white/60 uppercase mb-1">Payouts pendentes</div>
                  <div className="text-2xl font-bold text-amber-400">{(data.payoutsPendingCents / 100).toFixed(2)} {data.currency}</div>
                </div>
              </div>
              {data.payouts && data.payouts.length > 0 && (
                <div className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/10 text-sm font-semibold uppercase">Últimos payouts</div>
                  <table className="w-full">
                    <thead className="bg-zinc-800/80">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs text-white/60 uppercase">Data</th>
                        <th className="px-4 py-2 text-right text-xs text-white/60 uppercase">Valor</th>
                        <th className="px-4 py-2 text-left text-xs text-white/60 uppercase">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {data.payouts.map((p) => (
                        <tr key={p.id} className="hover:bg-white/5">
                          <td className="px-4 py-2 text-sm text-white/80">
                            {new Date(p.createdAt).toLocaleDateString("pt-PT")}
                          </td>
                          <td className="px-4 py-2 text-sm text-right">{(p.amountCents / 100).toFixed(2)}</td>
                          <td className="px-4 py-2">
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                p.status === "PAID" ? "bg-green-500/20 text-green-400" : p.status === "PENDING" ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400"
                              }`}
                            >
                              {p.status === "PAID" ? "Pago" : p.status === "PENDING" ? "Pendente" : p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}
