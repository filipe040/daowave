import Link from "next/link";
import { PublicPage, PublicCard } from "@/components/public/public-page";

export default function ContactPage() {
  return (
    <PublicPage
      title="Contacto"
      subtitle="Questões, suporte técnico ou temas de conta. Resposta por email."
      backHref="/help"
      backLabel="Ajuda"
    >
      <div className="max-w-2xl space-y-4">
        <PublicCard>
          <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">Email de suporte</p>
          <a
            href="mailto:support@livepass.pt"
            className="mt-2 inline-flex items-center gap-2 text-base sm:text-lg font-bold text-[#5ec8f8] hover:text-[#00a0e3] transition"
          >
            support@livepass.pt
          </a>
          <p className="mt-3 text-sm text-zinc-400">
            Inclui o email da conta, ID da encomenda (se existir) e descrição do problema.
          </p>
        </PublicCard>

        <PublicCard>
          <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">Horário</p>
          <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
            Segunda a Sexta: <span className="font-bold text-white">09:00 – 18:00</span>
            <br />
            Fins de semana: <span className="font-bold text-white">Fechado</span>
          </p>
        </PublicCard>

        <PublicCard>
          <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">Para promotores</p>
          <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
            Indica o nome do evento e organização no email. Se já tens acesso, usa o painel de promotor.
          </p>
          <Link href="/auth/signin" className="inline-block mt-4 text-sm font-bold text-[#00a0e3] hover:underline">
            Área de promotor →
          </Link>
        </PublicCard>
      </div>
    </PublicPage>
  );
}
