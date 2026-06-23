import { ArrowRight, BarChart3, Users, Ticket, QrCode } from "lucide-react";
import PromoterLink from "@/app/components/PromoterLink";

const FEATURES = [
  { icon: Ticket, label: "Venda de bilhetes" },
  { icon: QrCode, label: "Check-in QR" },
  { icon: BarChart3, label: "Relatórios em tempo real" },
  { icon: Users, label: "Gestão de compradores" },
];

export function PromoterCta() {
  return (
    <section className="py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#0d1b2e] via-[#0f1520] to-[#0c0c12]">
          {/* Decorative gradient blobs */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#00a0e3]/15 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] bg-[#00a0e3]/5 blur-[80px] rounded-full pointer-events-none" />

          {/* Subtle grid */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />

          <div className="relative grid lg:grid-cols-2 gap-10 p-8 sm:p-12 lg:p-16 items-center">
            {/* Left: Text */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#00a0e3]/25 bg-[#00a0e3]/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-[#5ec8f8] mb-6">
                <Users className="h-3.5 w-3.5" />
                Para promotores
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                Organizas eventos?
                <br />
                <span
                  className="text-transparent bg-clip-text"
                  style={{
                    backgroundImage: "linear-gradient(135deg, #5ec8f8 0%, #00a0e3 60%, #818cf8 100%)",
                  }}
                >
                  Vende com a LivePass.
                </span>
              </h2>
              <p className="mt-4 text-base text-zinc-400 leading-relaxed max-w-md">
                Plataforma profissional para vender bilhetes, gerir lotes, fazer check-in e acompanhar as tuas finanças em tempo real.
              </p>
              <div className="mt-8">
                <PromoterLink className="inline-flex items-center justify-center gap-2 rounded-full bg-[#00a0e3] px-8 py-3.5 text-sm font-bold text-white hover:bg-[#0090cc] transition-all shadow-xl shadow-[#00a0e3]/25 hover:shadow-[#00a0e3]/40 hover:scale-[1.02]">
                  Começar a vender <ArrowRight className="h-4 w-4" />
                </PromoterLink>
              </div>
            </div>

            {/* Right: Feature grid */}
            <div className="grid grid-cols-2 gap-3">
              {FEATURES.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 hover:border-[#00a0e3]/20 hover:bg-white/[0.05] transition-all duration-200"
                >
                  <div className="h-10 w-10 rounded-xl bg-[#00a0e3]/15 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-[#5ec8f8]" />
                  </div>
                  <p className="text-sm font-semibold text-zinc-300">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
