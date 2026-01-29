import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";

export default function PrivacyPage() {
  const updatedAt = new Date().toLocaleDateString("pt-PT");

  return (
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[13px] font-semibold text-white/80 hover:text-white hover:bg-white/8 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <Link
          href="mailto:suporte@7evenprod.pt"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[13px] font-semibold text-white/80 hover:text-white hover:bg-white/8 transition"
        >
          <Mail className="h-4 w-4" />
          Suporte
        </Link>
      </div>

      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-8 sm:p-10 shadow-[0_18px_60px_rgba(0,0,0,.45)]">
        <div className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full bg-white/6 blur-3xl" />

        <div className="relative">
          <div className="text-[11px] uppercase tracking-wider text-white/45">Legal</div>
          <h1 className="mt-2 text-[26px] sm:text-[32px] font-semibold tracking-tight text-white/90">
            Política de Privacidade
          </h1>
          <p className="mt-3 text-[13px] sm:text-[14px] text-white/55 max-w-2xl">
            Esta política explica como recolhemos, utilizamos e protegemos os seus dados pessoais quando utiliza a
            EasyTicket.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mt-6 space-y-4">
        {[
          {
            title: "1. Recolha de Dados",
            body: (
              <>
                Recolhemos informações que nos fornece diretamente, incluindo nome, email e informações de pagamento
                quando compra bilhetes ou cria uma conta.
              </>
            ),
          },
          {
            title: "2. Utilização dos Dados",
            body: (
              <>
                Utilizamos os seus dados para:
                <ul className="mt-3 space-y-2">
                  <li className="flex gap-2">
                    <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-white/40" />
                    <span>Processar e gerir as suas compras</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-white/40" />
                    <span>Enviar confirmações e bilhetes</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-white/40" />
                    <span>Comunicar sobre eventos e atualizações</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-white/40" />
                    <span>Melhorar os nossos serviços</span>
                  </li>
                </ul>
              </>
            ),
          },
          {
            title: "3. Partilha de Dados",
            body: (
              <>
                Partilhamos os seus dados apenas com organizadores de eventos para os quais comprou bilhetes e com
                prestadores de serviços que nos ajudam a operar a plataforma (ex.: processamento de pagamentos).
              </>
            ),
          },
          {
            title: "4. Segurança",
            body: (
              <>
                Implementamos medidas de segurança técnicas e organizacionais para proteger os seus dados pessoais contra
                acesso não autorizado, alteração, divulgação ou destruição.
              </>
            ),
          },
          {
            title: "5. Os Seus Direitos",
            body: (
              <>
                Tem o direito de:
                <ul className="mt-3 space-y-2">
                  <li className="flex gap-2">
                    <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-white/40" />
                    <span>Aceder aos seus dados pessoais</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-white/40" />
                    <span>Retificar dados incorretos</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-white/40" />
                    <span>Solicitar a eliminação dos seus dados</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-white/40" />
                    <span>Opor-se ao tratamento dos seus dados</span>
                  </li>
                </ul>
              </>
            ),
          },
          {
            title: "6. Cookies",
            body: (
              <>
                Utilizamos cookies para melhorar a sua experiência na plataforma. Pode gerir as preferências de cookies
                nas definições do seu navegador.
              </>
            ),
          },
          {
            title: "7. Contacto",
            body: (
              <>
                Para questões sobre privacidade ou para exercer os seus direitos, contacte-nos através do email de
                suporte. Responderemos com a maior brevidade possível.
              </>
            ),
          },
        ].map((sec) => (
          <section
            key={sec.title}
            className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_18px_60px_rgba(0,0,0,.35)]"
          >
            <h2 className="text-[16px] sm:text-[18px] font-semibold text-white/90">{sec.title}</h2>
            <div className="mt-3 text-[13px] sm:text-[14px] leading-relaxed text-white/60">{sec.body}</div>
          </section>
        ))}

        <div className="pt-2 text-center text-[12px] text-white/45">
          Última atualização: {updatedAt}
        </div>
      </div>
    </div>
  );
}