"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCircle2, Loader2 } from "lucide-react";

interface TicketPresaveProps {
  eventSlug: string;
  variant?: "dark" | "light";
  userEmail?: string | null;
  userName?: string | null;
}

export function TicketPresave({ eventSlug, variant = "light", userEmail, userName }: TicketPresaveProps) {
  const [email, setEmail] = useState(userEmail ?? "");
  const [name, setName] = useState(userName ?? "");
  const [nextSaleAt, setNextSaleAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/events/${eventSlug}/ticket-alert`)
      .then((r) => r.json())
      .then((data) => {
        if (data.nextSaleAt) setNextSaleAt(data.nextSaleAt);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [eventSlug]);

  useEffect(() => {
    if (userEmail) setEmail(userEmail);
    if (userName) setName(userName);
  }, [userEmail, userName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch(`/api/events/${eventSlug}/ticket-alert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), name: name.trim() || undefined }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Não foi possível registar o seu email");
      setSubmitting(false);
      return;
    }

    setSuccess(true);
    setSubmitting(false);
  };

  const isLight = variant === "light";
  const shellCls = isLight
    ? "bg-white rounded-2xl ring-1 ring-black/[0.08] p-6 shadow-sm"
    : "bg-white/5 backdrop-blur-3xl rounded-[32px] border border-white/10 p-6 sm:p-8 shadow-2xl";

  if (loading) {
    return (
      <div className={`${shellCls} text-center py-8`}>
        <Loader2 className={`h-6 w-6 animate-spin mx-auto ${isLight ? "text-neutral-400" : "text-white/50"}`} />
      </div>
    );
  }

  if (success) {
    return (
      <div className={`${shellCls} text-center py-8 space-y-3`}>
        <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
        <h3 className={`font-bold text-lg ${isLight ? "text-neutral-900" : "text-white"}`}>
          Está na lista!
        </h3>
        <p className={`text-sm ${isLight ? "text-neutral-500" : "text-white/70"}`}>
          Enviaremos um email para <strong>{email}</strong> assim que os bilhetes estiverem à venda.
        </p>
      </div>
    );
  }

  const nextSaleLabel = nextSaleAt
    ? new Date(nextSaleAt).toLocaleString("pt-PT", { dateStyle: "long", timeStyle: "short" })
    : null;

  return (
    <div className={shellCls}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${isLight ? "bg-[#00a0e3]/15" : "bg-white/10"}`}>
          <Bell className={`h-5 w-5 ${isLight ? "text-[#00a0e3]" : "text-white"}`} />
        </div>
        <div>
          <h2 className={`text-lg font-bold ${isLight ? "text-neutral-900" : "text-white"}`}>
            Avisar-me quando abrir
          </h2>
          <p className={`text-xs ${isLight ? "text-neutral-500" : "text-white/60"}`}>
            Bilhetes ainda não disponíveis
          </p>
        </div>
      </div>

      {nextSaleLabel && (
        <p className={`text-sm mb-4 px-3 py-2 rounded-xl ${isLight ? "bg-amber-50 text-amber-800 border border-amber-100" : "bg-amber-500/10 text-amber-200 border border-amber-500/20"}`}>
          Venda prevista para <strong>{nextSaleLabel}</strong>
        </p>
      )}

      <p className={`text-sm mb-5 ${isLight ? "text-neutral-600" : "text-white/70"}`}>
        Deixe o seu email e receba uma notificação no momento em que os bilhetes ficarem disponíveis para compra.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        {!userName && (
          <label className="block">
            <span className={`text-xs font-bold uppercase tracking-wide ${isLight ? "text-neutral-500" : "text-white/50"}`}>
              Nome (opcional)
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`mt-1 w-full rounded-xl border px-3 py-2.5 text-sm ${isLight ? "border-neutral-200 bg-white" : "border-white/20 bg-white/5 text-white"}`}
              placeholder="O seu nome"
            />
          </label>
        )}
        <label className="block">
          <span className={`text-xs font-bold uppercase tracking-wide ${isLight ? "text-neutral-500" : "text-white/50"}`}>
            Email
          </span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`mt-1 w-full rounded-xl border px-3 py-2.5 text-sm ${isLight ? "border-neutral-200 bg-white" : "border-white/20 bg-white/5 text-white"}`}
            placeholder="email@exemplo.com"
          />
        </label>

        {error && (
          <p className="text-sm text-red-600 font-medium" role="alert">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting || !email.trim()}
          className={`w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 ${
            isLight
              ? "bg-gradient-to-r from-[#00a0e3] to-[#0090cc] text-white shadow-md shadow-[#00a0e3]/25 hover:opacity-95"
              : "bg-white text-black hover:bg-white/90"
          }`}
        >
          {submitting ? "A registar…" : "Quero ser avisado"}
        </button>
      </form>

      <p className={`mt-4 text-[11px] text-center ${isLight ? "text-neutral-400" : "text-white/40"}`}>
        Pode cancelar a subscrição a qualquer momento através do link no email.
      </p>
    </div>
  );
}
