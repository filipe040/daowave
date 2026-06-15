import { ShieldCheck, Zap, Ticket, CreditCard } from "lucide-react";

const ITEMS = [
  { icon: ShieldCheck, label: "Compra segura" },
  { icon: Zap, label: "Confirmação imediata" },
  { icon: Ticket, label: "Bilhete digital QR" },
  { icon: CreditCard, label: "MB Way · Multibanco · Cartão" },
];

export function TrustStrip({ stats }: { stats: { tickets: number; events: number; promoters: number } }) {
  return (
    <section className="border-b border-white/[0.06] bg-[#0a0a10]/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-3 gap-4 sm:gap-8 text-center mb-8 pb-8 border-b border-white/[0.06]">
          <div>
            <p className="text-2xl sm:text-4xl font-black text-white tabular-nums">
              +{stats.tickets.toLocaleString("pt-PT")}
            </p>
            <p className="mt-1 text-[10px] sm:text-xs uppercase tracking-widest text-zinc-500 font-semibold">
              Bilhetes vendidos
            </p>
          </div>
          <div>
            <p className="text-2xl sm:text-4xl font-black text-[#5ec8f8] tabular-nums">
              +{stats.events}
            </p>
            <p className="mt-1 text-[10px] sm:text-xs uppercase tracking-widest text-zinc-500 font-semibold">
              Eventos
            </p>
          </div>
          <div>
            <p className="text-2xl sm:text-4xl font-black text-white tabular-nums">
              +{stats.promoters}
            </p>
            <p className="mt-1 text-[10px] sm:text-xs uppercase tracking-widest text-zinc-500 font-semibold">
              Promotores
            </p>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3 sm:gap-6">
          {ITEMS.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs sm:text-sm font-semibold text-zinc-300"
            >
              <Icon className="h-4 w-4 text-[#00a0e3] shrink-0" />
              {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
