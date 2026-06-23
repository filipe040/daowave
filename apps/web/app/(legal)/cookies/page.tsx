import { LegalPage, LegalSection, LegalNote } from "@/components/public/legal-page";

export const metadata = {
  title: "Política de Cookies — LivePass",
  description: "Como utilizamos cookies para melhorar a tua experiência na plataforma.",
};

const COOKIES = [
  {
    category: "Essenciais",
    badge: "Sempre ativos",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    description:
      "Necessários para o funcionamento técnico do website (sessão, tokens de login, carrinho seguro). O site não opera corretamente sem estes cookies e não requerem consentimento.",
    duration: "Sessão",
  },
  {
    category: "Analíticos",
    badge: "Requerem consentimento",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    description:
      "Utilizados para medição interna de visitas e tráfego (Google Analytics). Agregam métricas de forma anónima, sem identificação individual do utilizador.",
    duration: "1 dia – 2 anos",
  },
  {
    category: "Marketing",
    badge: "Requerem consentimento",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    description:
      "Usados para exibir publicidade relevante e retargeting, prevenindo repetições de anúncios indesejados da nossa marca noutros websites.",
    duration: "Variável",
  },
];

export default function CookiesPage() {
  return (
    <LegalPage
      title="Política de Cookies"
      subtitle="Como utilizamos cookies para tornar a tua experiência mais eficiente e útil."
      updated="Janeiro 2025"
    >
      <LegalSection title="O que são cookies?">
        <p>
          Cookies são pequenos fragmentos de texto descarregados para o teu dispositivo quando
          interages com o nosso site. Ajudam a agilizar tarefas cruciais de navegação, como manter
          a sessão ativa e lembrar as tuas preferências.
        </p>
      </LegalSection>

      <LegalSection title="Cookies que utilizamos">
        <div className="space-y-3 mt-1">
          {COOKIES.map((c) => (
            <div
              key={c.category}
              className="rounded-xl border border-white/8 bg-white/[0.025] p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-white">{c.category}</span>
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${c.badgeColor}`}
                >
                  {c.badge}
                </span>
                <span className="ml-auto text-xs text-zinc-500">{c.duration}</span>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">{c.description}</p>
            </div>
          ))}
        </div>
      </LegalSection>

      <LegalSection title="Gerir as tuas preferências">
        <p>
          Podes gerir, a qualquer momento, as tuas preferências de consentimento através do painel
          de <strong>Definições de Cookies</strong> disponibilizado no nosso site, ou nas
          configurações do teu browser.
        </p>
      </LegalSection>

      <LegalNote>
        <p>
          Para mais informações sobre como protegemos os teus dados, consulta a nossa{" "}
          <a href="/privacy">Política de Privacidade</a>.
        </p>
      </LegalNote>
    </LegalPage>
  );
}
