"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PromoterSidebar from "@/app/promotor/components/promoter-sidebar";
import Breadcrumbs from "@/app/components/breadcrumbs";

type Order = {
  id: string;
  totalCents: number;
  status: string;
  createdAt: string;
  user: { id: string; name: string | null; email: string | null };
  items: { quantity: number; ticketLot: { name: string } }[];
  _count: { tickets: number };
};

export default function SalesContent({
  eventId,
  eventTitle,
}: {
  eventId: string;
  eventTitle: string;
}) {
  const [data, setData] = useState<{ data: Order[]; total: number; page: number; limit: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("");
  const limit = 20;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.set("status", status);
    fetch(`/api/promotor/events/${eventId}/sales?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao carregar vendas");
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [eventId, page, status]);

  return (
    <div className="min-h-screen bg-black text-white flex">
      <PromoterSidebar eventId={eventId} />
      <main className="flex-1 overflow-y-auto lg:ml-72 pt-12 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8 space-y-4">
          <Breadcrumbs
            items={[
              { label: "ESTÚDIO", href: `/promotor/events/${eventId}` },
              { label: "VENDAS", active: true },
            ]}
          />
          <h1 className="text-xl sm:text-2xl font-bold uppercase">Vendas — {eventTitle}</h1>

          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-white/60">Filtrar:</span>
            {["", "PAID", "PENDING", "CANCELED"].map((s) => (
              <button
                key={s || "all"}
                onClick={() => {
                  setStatus(s);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                  status === s
                    ? "bg-white/20 text-white"
                    : "bg-zinc-800 text-white/70 hover:bg-zinc-700"
                }`}
              >
                {s || "Todos"}
              </button>
            ))}
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-white/60 py-8">A carregar...</div>
          ) : data ? (
            <>
              <div className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-zinc-800/80">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-white/80 uppercase">Data</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-white/80 uppercase">Cliente</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-white/80 uppercase">Bilhetes</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-white/80 uppercase">Total</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-white/80 uppercase">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {data.data.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-white/50">
                            Nenhuma venda encontrada
                          </td>
                        </tr>
                      ) : (
                        data.data.map((order) => (
                          <tr key={order.id} className="hover:bg-white/5">
                            <td className="px-4 py-3 text-sm text-white/80">
                              {new Date(order.createdAt).toLocaleDateString("pt-PT")}{" "}
                              {new Date(order.createdAt).toLocaleTimeString("pt-PT", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-medium">{order.user?.name || "—"}</div>
                              <div className="text-sm text-white/50">{order.user?.email || ""}</div>
                            </td>
                            <td className="px-4 py-3 text-sm">{order._count.tickets}</td>
                            <td className="px-4 py-3 font-medium">
                              {(order.totalCents / 100).toFixed(2)} €
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  order.status === "PAID"
                                    ? "bg-green-500/20 text-green-400"
                                    : order.status === "PENDING"
                                    ? "bg-amber-500/20 text-amber-400"
                                    : "bg-red-500/20 text-red-400"
                                }`}
                              >
                                {order.status === "PAID" ? "Pago" : order.status === "PENDING" ? "Pendente" : "Cancelado"}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-white/60">
                <span>
                  {data.total} resultado(s) • página {data.page}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={data.page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-3 py-1.5 rounded bg-zinc-800 disabled:opacity-50 hover:bg-zinc-700"
                  >
                    Anterior
                  </button>
                  <button
                    disabled={data.page * data.limit >= data.total}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1.5 rounded bg-zinc-800 disabled:opacity-50 hover:bg-zinc-700"
                  >
                    Seguinte
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}
