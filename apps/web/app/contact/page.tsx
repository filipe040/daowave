export default function ContactPage() {
  return (
    <div className="min-h-screen mesh-gradient text-neutral-900">
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="mb-6 sm:mb-8">
          <div className="text-[11px] uppercase tracking-wider text-violet-600 font-bold">Suporte</div>
          <h1 className="mt-2 text-[28px] sm:text-[34px] font-black tracking-tight text-neutral-900">
            Contacto
          </h1>
          <p className="mt-2 text-[13px] sm:text-[15px] text-neutral-600 max-w-2xl">
            Questões, suporte técnico ou temas de conta. Resposta por email.
          </p>
        </div>

        <section className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-md">
          <h2 className="text-[16px] sm:text-[18px] font-bold text-neutral-900">
            Entre em contacto
          </h2>
          <p className="mt-2 text-[13px] sm:text-[14px] leading-relaxed text-neutral-600">
            Suporte centralizado por email para garantir rastreabilidade e tempos de resposta consistentes.
          </p>

          <div className="mt-6 space-y-5">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
              <div className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">
                Email de suporte
              </div>
              <a
                href="mailto:support@gopass.pt"
                className="mt-2 inline-flex items-center gap-2 text-[14px] sm:text-[15px] font-bold text-violet-700 hover:text-violet-800 transition"
              >
                support@gopass.pt
                <span className="text-neutral-400">→</span>
              </a>
              <p className="mt-2 text-[12px] text-neutral-600">
                Inclui: email da conta, ID da encomenda (se existir) e prints do erro.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
              <div className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">
                Horário de atendimento
              </div>
              <p className="mt-2 text-[13px] sm:text-[14px] text-neutral-700 leading-relaxed">
                Segunda a Sexta: <span className="font-bold text-neutral-900">09:00 – 18:00</span>
                <br />
                Sábado e Domingo: <span className="font-bold text-neutral-900">Fechado</span>
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
              <div className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">
                Para organizadores
              </div>
              <p className="mt-2 text-[13px] sm:text-[14px] text-neutral-700 leading-relaxed">
                Se és promotor e precisas de ajuda operacional, contacta via email e indica o nome do evento.
                Se já tens acesso, usa o estúdio para validar dados e operações.
              </p>
            </div>
          </div>

          <div className="mt-6 text-[12px] text-neutral-500">
            Última atualização: {new Date().toLocaleDateString("pt-PT")}
          </div>
        </section>
      </div>
    </div>
  );
}
