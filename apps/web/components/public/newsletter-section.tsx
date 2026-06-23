"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Bell, Mail } from "lucide-react";

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
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111118]">
          {/* Decorative glow */}
          <div className="absolute top-0 right-1/4 w-64 h-32 bg-[#00a0e3]/8 blur-[60px] rounded-full pointer-events-none" />

          <div className="relative p-6 sm:p-10 md:flex md:items-center md:justify-between md:gap-12">
            <div className="flex items-start gap-4 md:max-w-md">
              <div className="h-11 w-11 rounded-xl bg-[#00a0e3]/15 flex items-center justify-center shrink-0 mt-0.5">
                <Bell className="h-5 w-5 text-[#5ec8f8]" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white">Fica a par de tudo</h2>
                <p className="mt-1.5 text-sm text-zinc-500 leading-relaxed">
                  Recebe alertas sobre novos eventos e festivais em Portugal.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 md:mt-0 flex flex-col sm:flex-row gap-3 flex-1 max-w-lg">
              <div className="relative flex-1">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="O teu email"
                  className="h-12 w-full rounded-xl border border-white/10 bg-[#0c0c12] pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 outline-none transition-all focus:border-[#00a0e3]/40 focus:ring-2 focus:ring-[#00a0e3]/15"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="h-12 rounded-xl bg-[#00a0e3] px-7 text-sm font-bold text-white hover:bg-[#0090cc] disabled:opacity-60 shrink-0 transition-all hover:scale-[1.02] shadow-lg shadow-[#00a0e3]/20"
              >
                {loading ? "A enviar…" : "Subscrever"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
