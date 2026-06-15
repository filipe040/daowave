"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Mail, Loader2 } from "lucide-react";

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
};

const STATUS_OPTIONS = [
  { value: "ALL", label: "Todos" },
  { value: "NEW", label: "Novos" },
  { value: "READ", label: "Lidos" },
  { value: "REPLIED", label: "Respondidos" },
  { value: "ARCHIVED", label: "Arquivados" },
];

export default function AdminContactPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("NEW");
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/contact-messages?status=${status}`);
      const data = await res.json();
      if (res.ok) setMessages(data.messages ?? []);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/contact-messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await load();
        if (selected?.id === id) {
          setSelected((s) => (s ? { ...s, status: newStatus } : null));
        }
      }
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Mensagens de contacto</h1>
        <p className="mt-1 text-sm text-zinc-400">Pedidos enviados pelo formulário público /contact</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setStatus(opt.value)}
            className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
              status === opt.value
                ? "bg-[#00a0e3] text-white"
                : "bg-white/5 text-zinc-400 hover:text-white border border-white/10"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6 min-h-[480px]">
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-[#14141f] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-zinc-500">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <p className="p-8 text-sm text-zinc-500 text-center">Sem mensagens neste filtro.</p>
          ) : (
            <ul className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
              {messages.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(m);
                      if (m.status === "NEW") updateStatus(m.id, "READ");
                    }}
                    className={`w-full text-left px-4 py-4 hover:bg-white/5 transition-colors ${
                      selected?.id === m.id ? "bg-[#00a0e3]/10" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-white truncate">{m.subject}</p>
                      {m.status === "NEW" && (
                        <span className="shrink-0 h-2 w-2 rounded-full bg-[#00a0e3]" />
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">{m.name} · {m.email}</p>
                    <p className="text-[11px] text-zinc-600 mt-1">
                      {format(new Date(m.createdAt), "d MMM yyyy HH:mm", { locale: pt })}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="lg:col-span-3 rounded-2xl border border-white/10 bg-[#14141f] p-6">
          {selected ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-white">{selected.subject}</h2>
                <p className="text-sm text-zinc-400 mt-1">
                  {selected.name} —{" "}
                  <a href={`mailto:${selected.email}`} className="text-[#5ec8f8] hover:underline">
                    {selected.email}
                  </a>
                </p>
                <p className="text-xs text-zinc-600 mt-1">
                  {format(new Date(selected.createdAt), "EEEE, d 'de' MMMM 'às' HH:mm", { locale: pt })}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                {selected.message}
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject)}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#00a0e3] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0090cc]"
                >
                  <Mail className="h-4 w-4" />
                  Responder por email
                </a>
                {["READ", "REPLIED", "ARCHIVED"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={updating || selected.status === s}
                    onClick={() => updateStatus(selected.id, s)}
                    className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 disabled:opacity-40"
                  >
                    {s === "READ" ? "Marcar lido" : s === "REPLIED" ? "Respondido" : "Arquivar"}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-zinc-500">
              <Mail className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm">Seleciona uma mensagem</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
