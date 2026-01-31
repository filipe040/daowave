"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PromoterSidebar from "@/app/promotor/components/promoter-sidebar";
import Breadcrumbs from "@/app/components/breadcrumbs";

type Checkin = {
  id: string;
  result: string;
  scannedAt: string;
  ticket: { code: string; checkedInAt: Date | null };
  validator: { name: string | null; email: string | null } | null;
};

export default function CheckinsContent({
  eventId,
  eventTitle,
}: {
  eventId: string;
  eventTitle: string;
}) {
  const [data, setData] = useState<{ data: Checkin[]; total: number; page: number; limit: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/promotor/events/${eventId}/checkins?page=${page}&limit=${limit}`)
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao carregar check-ins");
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [eventId, page]);

  return (
    <div className="min-h-screen bg-black text-white flex">
      <PromoterSidebar eventId={eventId} />
      <main className="flex-1 overflow-y-auto lg:ml-72 pt-12 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8 space-y-4">
          <Breadcrumbs
            items={[
              { label: "ESTÚDIO", href: `/promotor/events/${eventId}` },
              { label: "CHECK-INS", active: true },
            ]}
          />
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-xl sm:text-2xl font-bold uppercase">Check-ins — {eventTitle}</h1>
            <Link
              href={`/promotor/checkin/${eventId}`}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium"
            >
              Abrir scanner
            </Link>
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
                        <th className="px-4 py-3 text-left text-xs font-semibold text-white/80 uppercase">Data/Hora</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-white/80 uppercase">Código bilhete</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-white/80 uppercase">Validador</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-white/80 uppercase">Resultado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {data.data.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-white/50">
                            Nenhum check-in registado
                          </td>
                        </tr>
                      ) : (
                        data.data.map((log) => (
                          <tr key={log.id} className="hover:bg-white/5">
                            <td className="px-4 py-3 text-sm text-white/80">
                              {new Date(log.scannedAt).toLocaleDateString("pt-PT")}{" "}
                              {new Date(log.scannedAt).toLocaleTimeString("pt-PT", {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })}
                            </td>
                            <td className="px-4 py-3 font-mono text-sm">{log.ticket?.code ?? "—"}</td>
                            <td className="px-4 py-3 text-sm">
                              {log.validator?.name || "—"}
                              {log.validator?.email && (
                                <div className="text-white/50 text-xs">{log.validator.email}</div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  log.result === "VALID"
                                    ? "bg-green-500/20 text-green-400"
                                    : log.result === "ALREADY_USED"
                                    ? "bg-amber-500/20 text-amber-400"
                                    : "bg-red-500/20 text-red-400"
                                }`}
                              >
                                {log.result === "VALID"
                                  ? "Válido"
                                  : log.result === "ALREADY_USED"
                                  ? "Já usado"
                                  : log.result}
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
