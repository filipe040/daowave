import { PublicPage, PublicCard } from "@/components/public/public-page";

export const metadata = {
  title: "Política de Reembolsos — LivePass Bilhetes",
  description: "Política de reembolsos e cancelamentos para compras de bilhetes na LivePass.",
};

export default function PoliticaReembolsosPage() {
  return (
    <PublicPage
      title="Política de reembolsos"
      subtitle="Última atualização: Fevereiro 2025"
      backHref="/"
    >
      <PublicCard className="max-w-3xl space-y-6 text-sm sm:text-base text-zinc-400 leading-relaxed">
        <section>
          <h2 className="text-base font-bold text-white mb-2">1. Condições gerais</h2>
          <p>
            A LivePass atua como plataforma intermediária entre promotores e compradores. Esta política aplica-se a
            todas as compras efetuadas na plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-white mb-2">2. Prazo para pedido</h2>
          <p>
            Os reembolsos podem ser solicitados até{" "}
            <strong className="text-white">48 horas antes</strong> do início do evento, salvo indicação contrária do
            promotor.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-white mb-2">3. Eventos cancelados</h2>
          <p>
            Se o evento for cancelado pelo promotor, o reembolso integral é processado automaticamente para o método
            de pagamento original.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-white mb-2">4. Como pedir reembolso</h2>
          <p>
            Contacta <a href="mailto:support@livepass.pt" className="text-[#5ec8f8] hover:underline">support@livepass.pt</a>{" "}
            com o ID da encomenda e motivo do pedido.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-white mb-2">5. Prazos de processamento</h2>
          <p>
            Após aprovação, o reembolso é processado em 5–10 dias úteis, dependendo do método de pagamento e da
            entidade bancária.
          </p>
        </section>
      </PublicCard>
    </PublicPage>
  );
}
