"use client";

import { useState } from "react";
import { PublicPage, PublicCard } from "@/components/public/public-page";
import { Loader2 } from "lucide-react";

export default function ContactPageClient() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao enviar");
        return;
      }
      setSent(true);
    } catch {
      setError("Erro de ligação");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <PublicPage title="Mensagem enviada" subtitle="Responderemos o mais breve possível." backHref="/">
        <PublicCard className="max-w-lg text-center">
          <p className="text-zinc-400 text-sm">Obrigado pelo contacto. A nossa equipa irá responder por email.</p>
        </PublicCard>
      </PublicPage>
    );
  }

  return (
    <PublicPage
      title="Contacto"
      subtitle="Envia-nos a tua questão e respondemos por email."
      backHref="/help"
      backLabel="Ajuda"
    >
      <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
        <PublicCard className="space-y-4">
          <div>
            <label className="public-label">Nome</label>
            <input
              required
              className="public-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="public-label">Email</label>
            <input
              type="email"
              required
              className="public-input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="public-label">Assunto</label>
            <input
              required
              className="public-input"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
          </div>
          <div>
            <label className="public-label">Mensagem</label>
            <textarea
              required
              rows={5}
              className="public-input min-h-[120px] py-3"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-[#00a0e3] font-bold text-white hover:bg-[#0090cc] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Enviar mensagem
          </button>
        </PublicCard>
      </form>
    </PublicPage>
  );
}
