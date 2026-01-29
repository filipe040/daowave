import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";

export default function TermsPage() {
  const updatedAt = new Date().toLocaleDateString("pt-PT");

  const sections: Array<{ title: string; body: React.ReactNode }> = [
    {
      title: "1. Aceitação dos Termos",
      body: (
        <>
          Ao aceder e utilizar a plataforma 7even Tickets, aceita estar vinculado a estes Termos e Condições.
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
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/70" />
                <span className="text-muted-foreground">{item}</span>
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
          A 7even Tickets não se responsabiliza por cancelamentos ou alterações de eventos organizados por terceiros.
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
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12 bg-background text-foreground">
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-2 text-[13px] font-semibold text-secondary-foreground
                     transition-colors hover:bg-secondary/80
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <Link
          href="mailto:suporte@7evenprod.pt"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-2 text-[13px] font-semibold text-secondary-foreground
                     transition-colors hover:bg-secondary/80
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Mail className="h-4 w-4" />
          Suporte
        </Link>
      </div>

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-8 sm:p-10 shadow-sm">
        <div className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Legal</div>
          <h1 className="mt-2 text-[26px] sm:text-[32px] font-semibold tracking-tight text-foreground">
            Termos e Condições
          </h1>
          <p className="mt-3 text-[13px] sm:text-[14px] text-muted-foreground max-w-2xl">
            Estes termos definem as regras de utilização da plataforma 7even Tickets e as condições aplicáveis à compra
            e gestão de bilhetes.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mt-6 space-y-4">
        {sections.map((sec) => (
          <section
            key={sec.title}
            className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm"
          >
            <h2 className="text-[16px] sm:text-[18px] font-semibold text-foreground">{sec.title}</h2>
            <div className="mt-3 text-[13px] sm:text-[14px] leading-relaxed text-muted-foreground">
              {sec.body}
            </div>
          </section>
        ))}

        <div className="pt-2 text-center text-[12px] text-muted-foreground">
          Última atualização: {updatedAt}
        </div>
      </div>
    </div>
  );
}