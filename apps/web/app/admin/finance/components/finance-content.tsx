"use client";

import { useEffect, useState } from "react";

type FinanceData = {
  gmvCents: number;
  ordersPaid: number;
  payoutsTotalCents: number;
  payoutsPaidCents: number;
  payoutsPendingCents: number;
  payoutsCount: number;
};

export default function FinanceContent() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/finance")
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao carregar financeiro");
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="w-full min-w-0 max-w-7xl mx-auto space-y-6 sm:space-y-8 px-2 sm:px-4 md:px-6 lg:px-8">
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold">Financeiro</h1>
        <p className="text-base text-zinc-400">GMV, pedidos pagos e payouts da plataforma</p>
      </div>
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-400">
          {error}
        </div>
      )}
      {loading ? (
        <div className="text-zinc-400 py-8">A carregar...</div>
      ) : data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-zinc-800/60 rounded-2xl border border-zinc-700/50 p-6">
            <div className="text-sm text-zinc-400 mb-2">GMV total</div>
            <div className="text-3xl font-bold text-white">{(data.gmvCents / 100).toFixed(2)} €</div>
          </div>
          <div className="bg-zinc-800/60 rounded-2xl border border-zinc-700/50 p-6">
            <div className="text-sm text-zinc-400 mb-2">Pedidos pagos</div>
            <div className="text-3xl font-bold text-white">{data.ordersPaid}</div>
          </div>
          <div className="bg-zinc-800/60 rounded-2xl border border-zinc-700/50 p-6">
            <div className="text-sm text-zinc-400 mb-2">Payouts pagos</div>
            <div className="text-3xl font-bold text-green-400">{(data.payoutsPaidCents / 100).toFixed(2)} €</div>
          </div>
          <div className="bg-zinc-800/60 rounded-2xl border border-zinc-700/50 p-6">
            <div className="text-sm text-zinc-400 mb-2">Payouts pendentes</div>
            <div className="text-3xl font-bold text-amber-400">{(data.payoutsPendingCents / 100).toFixed(2)} €</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
