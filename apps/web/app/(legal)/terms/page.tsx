import Link from "next/link";
import { getCompanyInfo } from "@/lib/company";
import { LegalPage, LegalSection, LegalNote } from "@/components/public/legal-page";

export const metadata = {
  title: "Termos e Condições — LivePass",
  description: "Termos e condições de uso e venda da plataforma LivePass.",
};

export default function TermsPage() {
  const { name, nif, address, email } = getCompanyInfo();

  return (
    <LegalPage
      title="Termos e Condições"
      subtitle="Regulam a utilização do website e o processo de compra de bilhetes digitais."
      updated="Janeiro 2025"
    >
      <LegalSection number="1" title="Informações da Empresa">
        <ul>
          <li><strong>Nome:</strong> {name}</li>
          {nif && <li><strong>NIF:</strong> {nif}</li>}
          {address && <li><strong>Sede:</strong> {address}</li>}
          <li>
            <strong>Email:</strong>{" "}
            <a href={`mailto:${email}`}>{email}</a>
          </li>
        </ul>
      </LegalSection>

      <LegalSection number="2" title="Processo de Compra">
        <p>A aquisição de bilhetes na nossa plataforma envolve os seguintes passos:</p>
        <ol>
          <li>Seleção do evento e tipo de bilhete desejado.</li>
          <li>Preenchimento dos dados do comprador e dos participantes (quando aplicável).</li>
          <li>Aceitação expressa destes Termos e Condições e da Política de Privacidade.</li>
          <li>Pagamento da encomenda através de um dos meios disponibilizados.</li>
        </ol>
        <p>A encomenda só é considerada válida e finalizada após a confirmação de boa cobrança.</p>
      </LegalSection>

      <LegalSection number="3" title="Preços e Taxas">
        <p>
          Todos os preços apresentados incluem IVA à taxa legal em vigor. O montante final inclui
          o preço do bilhete e, quando aplicável, as respetivas <strong>taxas de serviço e/ou de
          processamento</strong>, claramente discriminadas no checkout antes de finalizar o pagamento.
        </p>
      </LegalSection>

      <LegalSection number="4" title="Métodos de Pagamento">
        <p>
          Disponibilizamos métodos de pagamento estritamente seguros. O processamento dos dados
          associados aos pagamentos é efetuado por prestadores de serviços financeiros externos e
          certificados de acordo com as mais exigentes normas de segurança da indústria,
          garantindo a integridade dos teus dados.
        </p>
      </LegalSection>

      <LegalSection number="5" title="Entrega de Bilhetes Digitais">
        <p>
          Após a confirmação do pagamento, os bilhetes são emitidos exclusivamente em formato
          digital. São enviados para o endereço de e-mail fornecido na compra e ficam disponíveis
          para download na tua área de cliente.
        </p>
      </LegalSection>

      <LegalSection number="6" title="Direito de Livre Resolução e Reembolsos">
        <p>
          Ao abrigo da alínea l) do artigo 17.º do DL n.º 24/2014, de 14 de fevereiro, o direito
          de livre resolução de 14 dias <strong>não se aplica</strong> a bilhetes para eventos com
          data específica.
        </p>
        <p>
          As condições de reembolso, cancelamento e devolução estão detalhadas na nossa{" "}
          <Link href="/politica-reembolsos">Política de Reembolsos</Link>. Em caso de cancelamento
          do evento pelo promotor, procederemos à restituição conforme essa política e as
          comunicações do organizador.
        </p>
      </LegalSection>

      <LegalNote>
        <p>
          Para questões relacionadas com estes termos, contacta-nos em{" "}
          <a href={`mailto:${email}`}>{email}</a>.
        </p>
      </LegalNote>
    </LegalPage>
  );
}
