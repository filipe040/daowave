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
    await new Promise((r) => setTimeout(r, 600));
    toast.success("Obrigado! Em breve receberás novidades sobre eventos.");
    setEmail("");
    setLoading(false);
  };

  return (
    <section className="py-14 sm:py-20 border-t border-white/[0.06]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#14141f] to-[#0c0c12] p-8 sm:p-12 md:flex md:items-center md:justify-between md:gap-12">
          <div className="md:max-w-md">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Fica a par dos próximos eventos
            </h2>
            <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
              Subscreve a newsletter e recebe alertas sobre festivais, concertos e experiências em Portugal.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="mt-8 md:mt-0 flex flex-col sm:flex-row gap-3 flex-1 max-w-lg">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="O teu email"
              className="flex-1 h-12 rounded-xl border border-white/10 bg-[#0c0c12] px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00a0e3]/50 focus:ring-2 focus:ring-[#00a0e3]/20"
            />
            <button
              type="submit"
              disabled={loading}
              className="h-12 rounded-xl bg-[#00a0e3] px-8 text-sm font-bold text-white hover:bg-[#0090cc] transition-colors disabled:opacity-60 shrink-0"
            >
              {loading ? "A enviar…" : "Subscrever"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
