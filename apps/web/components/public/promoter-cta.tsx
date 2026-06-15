import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import PromoterLink from "@/app/components/PromoterLink";

export function PromoterCta() {
  return (
    <section className="py-14 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-[#00a0e3]/20 bg-gradient-to-br from-[#0066aa]/40 via-[#14141f] to-[#0c0c12] p-8 sm:p-12">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#00a0e3]/20 blur-[80px] rounded-full pointer-events-none" />
          <div className="relative text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-[#5ec8f8] mb-5">
              <Users className="h-3.5 w-3.5" />
              Para promotores
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Organizas eventos?
            </h2>
            <p className="mt-3 text-sm sm:text-base text-zinc-400 leading-relaxed">
              Vende bilhetes, gere lotes, check-in e finanças numa plataforma profissional.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <PromoterLink className="inline-flex items-center justify-center gap-2 rounded-full bg-[#00a0e3] px-8 py-3.5 text-sm font-bold text-white hover:bg-[#0090cc] transition-colors shadow-lg shadow-[#00a0e3]/25">
                Começar a vender <ArrowRight className="h-4 w-4" />
              </PromoterLink>
              <Link
                href="/sobre-nos"
                className="inline-flex items-center justify-center rounded-full border border-white/20 px-8 py-3.5 text-sm font-bold text-white hover:bg-white/5 transition-colors"
              >
                Saber mais
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
