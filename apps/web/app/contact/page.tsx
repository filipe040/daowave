export default function ContactPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="text-[11px] uppercase tracking-wider text-white/45">Suporte</div>
          <h1 className="mt-2 text-[28px] sm:text-[34px] font-semibold tracking-tight text-white/90">
            Contacto
          </h1>
          <p className="mt-2 text-[13px] sm:text-[14px] text-white/60 max-w-2xl">
            Questões, suporte técnico ou temas de conta. Resposta por email.
          </p>
        </div>

        {/* Card */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_18px_60px_rgba(0,0,0,.45)]">
          {/* Subtle highlight */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/6 blur-3xl" />

          <div className="relative">
            <h2 className="text-[16px] sm:text-[18px] font-semibold text-white/90">
              Entre em contacto
            </h2>
            <p className="mt-2 text-[13px] sm:text-[14px] leading-relaxed text-white/60">
              Suporte centralizado por email para garantir rastreabilidade e tempos de resposta consistentes.
            </p>

            <div className="mt-6 space-y-5">
              {/* Email */}
              <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                <div className="text-[11px] uppercase tracking-wider text-white/45">
                  Email de suporte
                </div>

                <a
                  href="mailto:support@7eventickets.pt"
                  className="mt-2 inline-flex items-center gap-2 text-[14px] sm:text-[15px] font-semibold text-white/85 hover:text-white transition"
                >
                  support@7eventickets.pt
                  <span className="text-white/40">→</span>
                </a>

                <p className="mt-2 text-[12px] text-white/55">
                  Inclui: email da conta, ID da encomenda (se existir) e prints do erro.
                </p>
              </div>

              {/* Hours */}
              <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                <div className="text-[11px] uppercase tracking-wider text-white/45">
                  Horário de atendimento
                </div>
                <p className="mt-2 text-[13px] sm:text-[14px] text-white/70 leading-relaxed">
                  Segunda a Sexta: <span className="font-semibold text-white/85">09:00 – 18:00</span>
                  <br />
                  Sábado e Domingo: <span className="font-semibold text-white/85">Fechado</span>
                </p>
              </div>

              {/* Organizers */}
              <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                <div className="text-[11px] uppercase tracking-wider text-white/45">
                  Para organizadores
                </div>
                <p className="mt-2 text-[13px] sm:text-[14px] text-white/70 leading-relaxed">
                  Se és promotor e precisas de ajuda operacional, contacta via email e indica o nome do evento.
                  Se já tens acesso, usa o estúdio para validar dados e operações.
                </p>
              </div>
            </div>

            {/* Footer note */}
            <div className="mt-6 text-[12px] text-white/45">
              Última atualização: {new Date().toLocaleDateString("pt-PT")}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}