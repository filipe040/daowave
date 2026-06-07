import Link from "next/link";
import { Ticket } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-neutral-200 bg-white">
      <div className="container mx-auto px-4">
        <div className="py-10 md:py-12">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 flex items-center justify-center shadow-md shadow-violet-500/20">
                  <Ticket className="h-5 w-5 text-white" strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base md:text-lg font-bold tracking-tight text-neutral-900">
                    LivePass
                  </h3>
                  <p className="text-[11px] md:text-xs uppercase tracking-wider text-neutral-500">
                    Bilhética &amp; acesso
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-neutral-600">
                Marketplace de bilhética para eventos em Portugal. QR codes assinados e validação em tempo real.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {["QR assinado", "Check-in realtime", "Pagamentos seguros"].map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-[11px] font-medium text-violet-700"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-neutral-900">Para Compradores</h4>
              <ul className="mt-4 space-y-2 text-sm">
                <li><Link href="/events" className="text-neutral-600 hover:text-violet-600 transition">Explorar eventos</Link></li>
                <li><Link href="/my-tickets" className="text-neutral-600 hover:text-violet-600 transition">Meus bilhetes</Link></li>
                <li><Link href="/help" className="text-neutral-600 hover:text-violet-600 transition">Ajuda</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-neutral-900">Legal</h4>
              <ul className="mt-4 space-y-2 text-sm">
                <li><Link href="/terms" className="text-neutral-600 hover:text-violet-600 transition">Termos e Condições</Link></li>
                <li><Link href="/privacy" className="text-neutral-600 hover:text-violet-600 transition">Política de Privacidade</Link></li>
                <li><Link href="/cookies" className="text-neutral-600 hover:text-violet-600 transition">Política de Cookies</Link></li>
                <li><Link href="/ral" className="text-neutral-600 hover:text-violet-600 transition">Resolução de Litígios (RAL)</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-neutral-900">Para Promotores</h4>
              <ul className="mt-4 space-y-2 text-sm">
                <li><Link href="/auth/signin?register=organizer" className="text-neutral-600 hover:text-violet-600 transition">Criar conta</Link></li>
                <li><Link href="/organizer" className="text-neutral-600 hover:text-violet-600 transition">Área do promotor</Link></li>
                <li><Link href="/organizer/events/new" className="text-neutral-600 hover:text-violet-600 transition">Criar evento</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-neutral-900">Suporte</h4>
              <ul className="mt-4 space-y-2 text-sm">
                <li><Link href="/sobre-nos" className="text-neutral-600 hover:text-violet-600 transition">Sobre Nós</Link></li>
                <li><Link href="/faq" className="text-neutral-600 hover:text-violet-600 transition">Perguntas Frequentes</Link></li>
                <li><a href="mailto:suporte@livepass.pt" className="text-neutral-600 hover:text-violet-600 transition">suporte@livepass.pt</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-200 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-neutral-500">
              © {year} LivePass. Todos os direitos reservados.
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
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-600 hover:text-violet-600 hover:border-violet-200 hover:bg-violet-50 transition"
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
