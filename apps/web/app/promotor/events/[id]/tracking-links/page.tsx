"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageShell } from "@/components/dashboard/PageShell";
import { api } from "@/lib/api-client";
import { Copy, Plus } from "lucide-react";

type Link = { id: string; code: string; label: string | null; clicks: number; conversions: number };

export default function TrackingLinksPage() {
  const params = useParams();
  const eventId = params.id as string;
  const [links, setLinks] = useState<Link[]>([]);
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await api.get<Link[]>(`/api/promotor/events/${eventId}/tracking-links`);
    setLinks(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [eventId]);

  const create = async () => {
    if (!code.trim()) return;
    await api.post(`/api/promotor/events/${eventId}/tracking-links`, {
      code: code.toLowerCase().replace(/\s+/g, "-"),
      label: label || undefined,
    });
    setCode("");
    setLabel("");
    load();
  };

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <PageShell title="Tracking links" subtitle="Links de campanha com rastreio de cliques">
      <div className="dash-card p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            className="dash-input flex-1"
            placeholder="codigo-campanha"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <input
            className="dash-input flex-1"
            placeholder="Etiqueta (opcional)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <button type="button" onClick={create} className="dash-btn-primary shrink-0">
            <Plus className="h-4 w-4" /> Criar
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-neutral-500">A carregar…</p>
        ) : links.length === 0 ? (
          <p className="text-sm text-neutral-500">Sem links criados.</p>
        ) : (
          <ul className="space-y-3">
            {links.map((l) => {
              const url = `${baseUrl}/events?ref=${l.code}`;
              return (
                <li key={l.id} className="rounded-xl border border-neutral-200 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-neutral-900">{l.label || l.code}</p>
                    <p className="text-xs text-neutral-500 truncate">{url}</p>
                    <p className="text-xs text-neutral-400 mt-1">
                      {l.clicks} cliques · {l.conversions} conversões
                    </p>
                  </div>
                  <button
                    type="button"
                    className="dash-btn-secondary text-sm"
                    onClick={() => navigator.clipboard.writeText(url)}
                  >
                    <Copy className="h-4 w-4" /> Copiar
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </PageShell>
  );
}
