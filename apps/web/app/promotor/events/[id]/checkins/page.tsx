"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageShell } from "@/components/dashboard/PageShell";
import { api } from "@/lib/api-client";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { EventStudioNav } from "@/components/promoter/EventStudioNav";

type Checkin = {
  id: string;
  checkedInAt: string;
  ticket: { code: string; user: { name: string | null; email: string } };
};

export default function EventCheckinsPage() {
  const params = useParams();
  const eventId = params.id as string;
  const [items, setItems] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await api.get<{ data: Checkin[] }>(`/api/promotor/events/${eventId}/checkins`);
      setItems(data?.data ?? []);
      setLoading(false);
    })();
  }, [eventId]);

  return (
    <PageShell title="Lista de check-ins" subtitle="Entradas registadas no evento">
      <div className="max-w-4xl space-y-6">
        <EventStudioNav eventId={eventId} />
      <div className="dash-card overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-zinc-500">A carregar…</p>
        ) : items.length === 0 ? (
          <p className="p-6 text-sm text-zinc-500">Ainda sem check-ins.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="text-left p-3 font-semibold">Bilhete</th>
                  <th className="text-left p-3 font-semibold">Participante</th>
                  <th className="text-left p-3 font-semibold">Hora</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.id} className="border-b border-white/10">
                    <td className="p-3 font-mono">{c.ticket?.code}</td>
                    <td className="p-3">{c.ticket?.user?.name || c.ticket?.user?.email}</td>
                    <td className="p-3 text-zinc-500">
                      {format(new Date(c.checkedInAt), "dd MMM yyyy HH:mm", { locale: pt })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </PageShell>
  );
}
