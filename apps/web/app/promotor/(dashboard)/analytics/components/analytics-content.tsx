"use client";

import { useEffect, useState } from "react";
import PromoterSidebar from "@/app/promotor/components/promoter-sidebar";

type EventOption = { id: string; title: string };
type DayData = { date: string; revenueCents: number };

export default function AnalyticsContent({ events }: { events: EventOption[] }) {
  const [eventId, setEventId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState<{ data: DayData[]; from: string; to: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const toDate = to || new Date().toISOString().slice(0, 10);
    const fromDate = from || (() => {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return d.toISOString().slice(0, 10);
    })();
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ from: fromDate, to: toDate });
    if (eventId) params.set("eventId", eventId);
    fetch(`/api/promotor/analytics?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao carregar analytics");
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [eventId, from, to]);

  return (
    <div className="min-h-screen bg-black text-white flex">
      <PromoterSidebar />
      <main className="flex-1 overflow-y-auto lg:ml-72 pt-12 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8 space-y-4">
          <h1 className="text-xl sm:text-2xl font-bold uppercase">Analytics — Vendas por dia</h1>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs text-white/60 mb-1">Evento (opcional)</label>
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm min-w-[200px]"
              >
                <option value="">Todos os eventos</option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1">De</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1">Até</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400">
              {error}
            </div>
          )}
          {loading ? (
            <div className="text-white/60 py-8">A carregar...</div>
          ) : data ? (
            <div className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden">
              {data.data.length === 0 ? (
                <div className="px-4 py-8 text-center text-white/50">Sem dados no período.</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-zinc-800/80">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white/80 uppercase">Data</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-white/80 uppercase">Receita (€)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {data.data.map((row) => (
                      <tr key={row.date} className="hover:bg-white/5">
                        <td className="px-4 py-3 text-sm text-white/80">{row.date}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium">
                          {(row.revenueCents / 100).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
