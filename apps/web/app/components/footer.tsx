export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-white/10 bg-zinc-950">
      <div className="container mx-auto px-4">
        {/* Top */}
        <div className="py-10 md:py-12">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
                  <div className="grid grid-cols-2 gap-1">
                    <span className="h-1.5 w-1.5 rounded-sm bg-white/80" />
                    <span className="h-1.5 w-1.5 rounded-sm bg-white/80" />
                    <span className="h-1.5 w-1.5 rounded-sm bg-white/80" />
                    <span className="h-1.5 w-1.5 rounded-sm bg-white/80" />
                  </div>
                </div>

                <div className="min-w-0">
                  <h3 className="text-base md:text-lg font-semibold tracking-wide text-white/90">
                    EasyTicket
                  </h3>
                  <p className="text-[11px] md:text-xs uppercase tracking-wider text-white/40">
                    Bilhética &amp; acesso
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-white/55">
                Marketplace de bilhética para eventos em Portugal. QR codes assinados e validação em tempo real.
              </p>

              {/* Trust chips */}
              <div className="mt-5 flex flex-wrap gap-2">
                {["QR assinado", "Check-in realtime", "Pagamentos seguros"].map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/60"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Buyers */}
            <div>
              <h4 className="text-sm font-semibold text-white/85">Para Compradores</h4>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <a href="/events" className="text-white/55 hover:text-white transition">
                    Explorar eventos
                  </a>
                </li>
                <li>
                  <a href="/my-tickets" className="text-white/55 hover:text-white transition">
                    Meus bilhetes
                  </a>
                </li>
                <li>
                  <a href="/help" className="text-white/55 hover:text-white transition">
                    Ajuda
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-semibold text-white/85">Legal</h4>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <a href="/legal/terms" className="text-white/55 hover:text-white transition">
                    Termos e Condições
                  </a>
                </li>
                <li>
                  <a href="/legal/privacy" className="text-white/55 hover:text-white transition">
                    Política de Privacidade
                  </a>
                </li>
                <li>
                  <a href="/legal/cookies" className="text-white/55 hover:text-white transition">
                    Política de Cookies
                  </a>
                </li>
                <li>
                  <a href="/legal/ral" className="text-white/55 hover:text-white transition">
                    Resolução de Litígios (RAL)
                  </a>
                </li>
              </ul>

              <div className="mt-6">
                <a href="https://www.livroreclamacoes.pt" target="_blank" rel="noopener noreferrer" className="inline-block transition hover:opacity-80">
                  <img src="https://www.livroreclamacoes.pt/assets/images/logo_lre.png" alt="Livro de Reclamações Eletrónico" className="h-10 object-contain bg-white px-2 py-1 rounded-md" />
                </a>
              </div>
            </div>

            {/* Promoters */}
            <div>
              <h4 className="text-sm font-semibold text-white/85">Para Promotores</h4>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <a
                    href="/auth/signin?register=organizer"
                    className="text-white/55 hover:text-white transition"
                  >
                    Criar conta
                  </a>
                </li>
                <li>
                  <a href="/organizer" className="text-white/55 hover:text-white transition">
                    Área do promotor
                  </a>
                </li>
                <li>
                  <a
                    href="/organizer/events/new"
                    className="text-white/55 hover:text-white transition"
                  >
                    Criar evento
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white/85">Suporte</h4>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <a href="/sobre-nos" className="text-white/55 hover:text-white transition">
                    Sobre Nós
                  </a>
                </li>
                <li>
                  <a href="/faq" className="text-white/55 hover:text-white transition">
                    Perguntas Frequentes
                  </a>
                </li>
                <li>
                  <a href="mailto:suporte@easyticket.pt" className="text-white/55 hover:text-white transition">
                    suporte@easyticket.pt
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-white/45">
              © {year} EasyTicket. Todos os direitos reservados.
            </p>

            <div className="flex items-center gap-2">
              {[
                { label: "Facebook", href: "#" },
                { label: "Instagram", href: "#" },
                { label: "X", href: "#" },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/55 hover:text-white hover:bg-white/8 transition"
                  aria-label={s.label}
                >
                  <span className="text-xs font-semibold">{s.label === "Instagram" ? "IG" : s.label === "Facebook" ? "FB" : "X"}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}