import { ShieldCheck, Zap, Ticket, CreditCard } from "lucide-react";

const ITEMS = [
  { icon: ShieldCheck, label: "Compra segura" },
  { icon: Zap, label: "Confirmação imediata" },
  { icon: Ticket, label: "Bilhete digital QR" },
  { icon: CreditCard, label: "MB Way · Cartão" },
];

export function TrustStrip() {
  return (
    <section className="border-b border-white/[0.06] bg-[#0a0a10]/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
          {ITEMS.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 sm:px-4 py-2 text-[11px] sm:text-sm font-semibold text-zinc-300"
            >
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#00a0e3] shrink-0" />
              <span className="whitespace-nowrap">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
