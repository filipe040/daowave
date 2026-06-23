import { ShieldCheck, Zap, Ticket, CreditCard } from "lucide-react";

const ITEMS = [
  { icon: ShieldCheck, label: "Compra segura", desc: "Pagamento protegido" },
  { icon: Zap, label: "Confirmação imediata", desc: "QR code instantâneo" },
  { icon: Ticket, label: "Bilhete digital", desc: "Sempre no teu telemóvel" },
  { icon: CreditCard, label: "MB Way · Cartão", desc: "Vários métodos" },
];

export function TrustStrip() {
  return (
    <section className="border-b border-white/[0.06]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        <div className="flex flex-wrap justify-center gap-3 sm:gap-5">
          {ITEMS.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="flex items-center gap-4 rounded-xl border border-white/[0.07] bg-white/[0.025] px-8 py-5 hover:border-[#00a0e3]/25 hover:bg-white/[0.04] transition-all duration-200 group"
            >
              <div className="h-12 w-12 rounded-lg bg-[#00a0e3]/10 flex items-center justify-center shrink-0 group-hover:bg-[#00a0e3]/20 transition-colors">
                <Icon className="h-6 w-6 text-[#5ec8f8]" />
              </div>
              <div>
                <p className="text-base font-bold text-white">{label}</p>
                <p className="text-sm text-zinc-500 hidden sm:block">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
