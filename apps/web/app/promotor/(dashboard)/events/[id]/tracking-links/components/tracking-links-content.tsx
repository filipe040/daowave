"use client";

import { useEffect, useState } from "react";
import PromoterSidebar from "@/app/promotor/components/promoter-sidebar";
import Breadcrumbs from "@/app/components/breadcrumbs";

type LinkItem = {
  id: string;
  code: string;
  label: string | null;
  createdAt: string;
};

export default function TrackingLinksContent({
  eventId,
  eventTitle,
}: {
  eventId: string;
  eventTitle: string;
}) {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newCode, setNewCode] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`/api/promotor/events/${eventId}/tracking-links`)
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao carregar links");
        return res.json();
      })
      .then((json) => setLinks(json.data ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [eventId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/promotor/events/${eventId}/tracking-links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: newCode.trim().toLowerCase().replace(/\s/g, "-"), label: newLabel.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar link");
      setNewCode("");
      setNewLabel("");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao criar link");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (code: string) => {
    if (!confirm("Remover este link de rastreio?")) return;
    try {
      const res = await fetch(`/api/promotor/events/${eventId}/tracking-links/${encodeURIComponent(code)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao remover");
      }
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao remover");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      <PromoterSidebar eventId={eventId} />
      <main className="flex-1 overflow-y-auto lg:ml-72 pt-12 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8 space-y-4">
          <Breadcrumbs
            items={[
              { label: "ESTÚDIO", href: `/promotor/events/${eventId}` },
              { label: "TRACKING LINKS", active: true },
            ]}
          />
          <h1 className="text-xl sm:text-2xl font-bold uppercase">Links de rastreio — {eventTitle}</h1>
          <p className="text-sm text-white/60">
            Códigos para associar vendas a campanhas (ex.: instagram, newsletter). Use o parâmetro <code className="bg-white/10 px-1 rounded">ref=CODE</code> na URL do evento.
          </p>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleCreate} className="flex flex-wrap gap-2 items-end p-4 bg-zinc-900 rounded-xl border border-white/10">
            <div>
              <label className="block text-xs text-white/60 mb-1">Código (a-z, 0-9, _ -)</label>
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="ex: instagram"
                className="bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm w-40"
              />
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1">Etiqueta (opcional)</label>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="ex: Instagram Stories"
                className="bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm w-48"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !newCode.trim()}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium disabled:opacity-50"
            >
              {submitting ? "..." : "Criar"}
            </button>
          </form>

          {loading ? (
            <div className="text-white/60 py-8">A carregar...</div>
          ) : (
            <div className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden">
              {links.length === 0 ? (
                <div className="px-4 py-8 text-center text-white/50">Nenhum link de rastreio. Crie um acima.</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-zinc-800/80">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white/80 uppercase">Código</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white/80 uppercase">Etiqueta</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white/80 uppercase">Criado</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-white/80 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {links.map((link) => (
                      <tr key={link.id} className="hover:bg-white/5">
                        <td className="px-4 py-3 font-mono text-sm">{link.code}</td>
                        <td className="px-4 py-3 text-sm text-white/80">{link.label || "—"}</td>
                        <td className="px-4 py-3 text-sm text-white/60">
                          {new Date(link.createdAt).toLocaleDateString("pt-PT")}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDelete(link.code)}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Remover
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
