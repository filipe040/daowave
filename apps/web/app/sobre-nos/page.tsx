import { Music, MapPin, Shield } from "lucide-react";
import { PublicPage, PublicCard } from "@/components/public/public-page";
import PromoterLink from "@/app/components/PromoterLink";

export const metadata = {
  title: "Sobre Nós — LivePass Bilhetes",
  description:
    "Plataforma portuguesa de bilhética digital para ligar promotores ao público de forma simples e segura.",
};

const PILLARS = [
  { icon: Music, title: "Para o público", desc: "Compra em segundos, entra com QR." },
  { icon: MapPin, title: "Para promotores", desc: "Cria eventos, vende e analisa." },
  { icon: Shield, title: "Para todos", desc: "Bilhetes protegidos contra fraude." },
];

export default function SobreNosPage() {
  return (
    <PublicPage
      title="Sobre nós"
      subtitle="Bilhética digital feita em Portugal."
      backHref="/"
    >
      <div className="max-w-3xl space-y-6">
        <PublicCard>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
            A <span className="text-white font-semibold">LivePass</span> simplifica a venda de bilhetes para eventos ao
            vivo. Compra segura, bilhetes digitais e ferramentas profissionais para promotores.
          </p>
        </PublicCard>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {PILLARS.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-white/10 bg-[#14141f] p-5 text-center"
            >
              <item.icon className="h-8 w-8 text-[#00a0e3] mx-auto mb-3" />
              <h3 className="font-bold text-white text-sm">{item.title}</h3>
              <p className="mt-1 text-xs text-zinc-500">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-[#00a0e3]/30 bg-gradient-to-br from-[#0066aa]/20 to-[#14141f] p-6 sm:p-8 text-center">
          <h2 className="text-lg font-bold text-white">És promotor?</h2>
          <p className="mt-2 text-sm text-zinc-400">Começa a vender bilhetes na plataforma.</p>
          <PromoterLink className="inline-flex mt-5 rounded-full bg-[#00a0e3] px-6 py-3 text-sm font-bold text-white hover:bg-[#0090cc] transition-colors">
            Área de promotor
          </PromoterLink>
        </div>
      </div>
    </PublicPage>
  );
}
