"use client";

import { useState } from "react";
import { toast } from "sonner";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        toast.error("Não foi possível subscrever. Tenta novamente.");
        return;
      }
      toast.success("Subscrição confirmada!");
      setEmail("");
    } catch {
      toast.error("Erro de ligação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-12 sm:py-16 border-t border-white/[0.06]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-white/10 bg-[#14141f] p-6 sm:p-10 md:flex md:items-center md:justify-between md:gap-10">
          <div className="md:max-w-md">
            <h2 className="text-xl sm:text-2xl font-black text-white">Newsletter</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Recebe alertas sobre novos eventos e festivais em Portugal.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="mt-6 md:mt-0 flex flex-col sm:flex-row gap-3 flex-1 max-w-lg">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="O teu email"
              className="public-input flex-1"
            />
            <button
              type="submit"
              disabled={loading}
              className="h-11 sm:h-12 rounded-xl bg-[#00a0e3] px-6 text-sm font-bold text-white hover:bg-[#0090cc] disabled:opacity-60 shrink-0"
            >
              {loading ? "A enviar…" : "Subscrever"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
