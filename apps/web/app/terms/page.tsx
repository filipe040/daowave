import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { GlassSection } from "@/components/ui/glass-card";

export default function TermsPage() {
  const updatedAt = new Date().toLocaleDateString("pt-PT");

  const sections: Array<{ title: string; body: React.ReactNode }> = [
    {
      title: "1. Aceitação dos Termos",
      body: (
        <>
          Ao aceder e utilizar a plataforma EasyTicket, aceita estar vinculado a estes Termos e Condições.
          Se não concordar com qualquer parte destes termos, não deve utilizar a plataforma.
        </>
      ),
    },
    {
      title: "2. Utilização da Plataforma",
      body: (
        <>
          A plataforma permite a compra e gestão de bilhetes para eventos. Ao utilizar a plataforma, compromete-se a:
          <ul className="mt-3 space-y-2">
            {[
              "Fornecer informações precisas e atualizadas",
              "Manter a segurança da sua conta",
              "Utilizar a plataforma apenas para fins legais",
              "Não tentar aceder a áreas restritas sem autorização",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-white/50" />
                <span className="text-white/70">{item}</span>
              </li>
            ))}
          </ul>
        </>
      ),
    },
    {
      title: "3. Compra de Bilhetes",
      body: (
        <>
          Ao comprar bilhetes através da plataforma, concorda com os termos específicos do evento. Os bilhetes são
          não reembolsáveis, exceto conforme indicado na política de reembolso do evento.
        </>
      ),
    },
    {
      title: "4. Privacidade",
      body: (
        <>
          O tratamento dos seus dados pessoais está sujeito à nossa Política de Privacidade. Ao utilizar a plataforma,
          consente com a recolha e utilização dos seus dados conforme descrito nessa política.
        </>
      ),
    },
    {
      title: "5. Limitação de Responsabilidade",
      body: (
        <>
          A EasyTicket não se responsabiliza por cancelamentos ou alterações de eventos organizados por terceiros.
          Em caso de cancelamento, o reembolso será processado conforme a política do organizador.
        </>
      ),
    },
    {
      title: "6. Contacto",
      body: (
        <>
          Para questões sobre estes termos, contacte-nos através do email de suporte. Responderemos com a maior brevidade
          possível.
        </>
      ),
    },
  ];

  return (
    <PageShell
      eyebrow="Legal"
      title="Termos e Condições"
      subtitle="Regras de utilização da plataforma EasyTicket e condições aplicáveis à compra e gestão de bilhetes."
    >
      <div className="max-w-4xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <Link
            href="mailto:suporte@7evenprod.pt"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            <Mail className="h-4 w-4" />
            Suporte
          </Link>
        </div>

        <div className="space-y-4 animate-fade-in">
          {sections.map((sec) => (
            <GlassSection key={sec.title} className="p-6 sm:p-8">
              <h2 className="text-base sm:text-lg font-semibold text-white/90">{sec.title}</h2>
              <div className="mt-3 text-sm sm:text-base leading-relaxed text-white/65">
                {sec.body}
              </div>
            </GlassSection>
          ))}
          <p className="text-center text-xs text-white/50">Última atualização: {updatedAt}</p>
        </div>
      </div>
    </PageShell>
  );
}