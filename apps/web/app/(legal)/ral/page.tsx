import { getCompanyInfo } from "@/lib/company";
import { LegalPage, LegalSection, LegalNote } from "@/components/public/legal-page";

export const metadata = {
  title: "Resolução Alternativa de Litígios — LivePass",
  description: "Informação sobre mecanismos de resolução alternativa de litígios de consumo.",
};

export default function RalPage() {
  const { email } = getCompanyInfo();

  return (
    <LegalPage
      title="Resolução Alternativa de Litígios"
      subtitle="Em cumprimento do artigo 18.º da Lei n.º 144/2015, informamos sobre os mecanismos disponíveis para resolução de conflitos de consumo."
      updated="Janeiro 2025"
    >
      <LegalSection title="Contacto Prévio">
        <p>
          Em caso de litígio de consumo online, o cliente deve contactar previamente os nossos
          serviços através de <a href={`mailto:${email}`}>{email}</a>, procurando uma resolução
          amigável do diferendo antes de recorrer a qualquer entidade externa.
        </p>
      </LegalSection>

      <LegalSection title="Entidade de Resolução Alternativa">
        <p>
          Caso a resolução não seja alcançada, o consumidor pode recorrer a uma Entidade de
          Resolução Alternativa de Litígios de Consumo aprovada. Sugerimos:
        </p>
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <p className="font-semibold text-white mb-3">
            Centro Nacional de Informação e Arbitragem de Conflitos de Consumo (CNIACC)
          </p>
          <ul>
            <li><strong>Telefone:</strong> 213 847 484</li>
            <li>
              <strong>Website:</strong>{" "}
              <a href="https://www.cniacc.pt" target="_blank" rel="noopener noreferrer">
                www.cniacc.pt
              </a>
            </li>
            <li>
              <strong>Email:</strong>{" "}
              <a href="mailto:geral@cniacc.pt">geral@cniacc.pt</a>
            </li>
          </ul>
        </div>
      </LegalSection>

      <LegalSection title="Plataforma Europeia de Resolução de Litígios">
        <p>
          Alternativamente, o cidadão europeu pode recorrer à{" "}
          <strong>Plataforma Europeia de Resolução de Litígios em Linha (RLL)</strong>, gerida
          pela Comissão Europeia:
        </p>
        <p>
          <a
            href="https://ec.europa.eu/consumers/odr"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://ec.europa.eu/consumers/odr
          </a>
        </p>
      </LegalSection>

      <LegalNote>
        <p>
          Para questões ou dúvidas, contacta a nossa equipa em{" "}
          <a href={`mailto:${email}`}>{email}</a>.
        </p>
      </LegalNote>
    </LegalPage>
  );
}
