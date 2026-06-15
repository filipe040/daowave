"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageShell } from "@/components/dashboard/PageShell";
import { api } from "@/lib/api-client";
import { EventStudioNav } from "@/components/promoter/EventStudioNav";

type Member = {
  id: string;
  role: string;
  user: { name: string | null; email: string };
};

export default function EventTeamsPage() {
  const params = useParams();
  const eventId = params.id as string;
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await api.get<{ data: Member[] }>(`/api/promotor/events/${eventId}/teams`);
    setMembers(data?.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [eventId]);

  const invite = async () => {
    if (!email.trim()) return;
    await api.post(`/api/promotor/events/${eventId}/teams`, { email, role: "STAFF" });
    setEmail("");
    load();
  };

  return (
    <PageShell title="Equipa do evento" subtitle="Membros com acesso a check-in e operações">
      <div className="max-w-3xl space-y-6">
        <EventStudioNav eventId={eventId} />
      <div className="dash-card p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            className="dash-input flex-1"
            type="email"
            placeholder="email@membro.pt"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="button" onClick={invite} className="dash-btn-primary shrink-0">
            Adicionar
          </button>
        </div>
        {loading ? (
          <p className="text-sm text-zinc-500">A carregar…</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {members.map((m) => (
              <li key={m.id} className="py-3 flex justify-between gap-4">
                <div>
                  <p className="font-medium text-white">{m.user.name || m.user.email}</p>
                  <p className="text-xs text-zinc-500">{m.user.email}</p>
                </div>
                <span className="text-xs font-semibold uppercase text-[#00a0e3]">{m.role}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      </div>
    </PageShell>
  );
}
