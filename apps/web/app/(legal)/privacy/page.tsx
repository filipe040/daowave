import { getCompanyInfo } from "@/lib/company";
import { LegalPage, LegalSection, LegalNote } from "@/components/public/legal-page";

export const metadata = {
  title: "Política de Privacidade — LivePass",
  description: "Como recolhemos, usamos e protegemos os teus dados pessoais.",
};

export default function PrivacyPage() {
  const { name, nif, address, email } = getCompanyInfo();
  const entityName = name || "LivePass";
  const entityNif = nif || "— (a preencher em COMPANY_NIF)";
  const entityAddress = address || "— (a preencher em COMPANY_ADDRESS)";

  return (
    <LegalPage
      title="Política de Privacidade"
      subtitle="Como recolhemos, usamos e protegemos os teus dados pessoais, em cumprimento do RGPD."
      updated="Janeiro 2025"
    >
      <LegalSection number="1" title="Responsável pelo Tratamento">
        <ul>
          <li><strong>Entidade:</strong> {entityName}</li>
          <li><strong>NIF:</strong> {entityNif}</li>
          <li><strong>Morada:</strong> {entityAddress}</li>
          <li>
            <strong>Contacto:</strong>{" "}
            <a href={`mailto:${email}`}>{email}</a>
          </li>
        </ul>
      </LegalSection>

      <LegalSection number="2" title="Recolha e Finalidade do Tratamento">
        <p>
          O tratamento dos teus dados tem como fundamento jurídico a execução do contrato (compra
          do bilhete) e o cumprimento de obrigações legais, incluindo:
        </p>
        <ul>
          <li>
            <strong>Dados de Identificação e Contacto</strong> (Nome e Email): Recolhidos para
            efetuar a validação, entrega dos bilhetes digitais e envio de comunicações operacionais
            relativas ao evento.
          </li>
          <li>
            <strong>Dados de Faturação</strong> (Nome, Morada e NIF): Exigidos estritamente para o
            cumprimento de preceitos legais e fiscais perante a Autoridade Tributária.
          </li>
        </ul>
      </LegalSection>

      <LegalSection number="3" title="Prazo de Conservação dos Dados">
        <p>
          Mantemos os dados de identificação pelo tempo em que a tua conta se mantiver ativa ou
          durante o ciclo de vida do evento. Relativamente aos <strong>dados de faturação</strong>,
          conservá-los-emos pelo período legalmente exigido de 10 anos, tal como determinado pelo
          artigo 130.º do Código do IRS.
        </p>
      </LegalSection>

      <LegalSection number="4" title="Partilha de Dados">
        <p>
          Os dados recolhidos poderão ser acedidos pelo Promotor/Organizador responsável pelo
          evento unicamente para fins logísticos (e.g. validação de entradas) e por serviços
          parceiros de processamento de pagamentos. Em caso algum venderemos ou cederemos os teus
          dados a entidades terceiras com finalidades de marketing não solicitado.
        </p>
      </LegalSection>

      <LegalSection number="5" title="Os Teus Direitos (RGPD)">
        <p>De acordo com o RGPD, tens o direito de:</p>
        <ol>
          <li>Solicitar o <strong>acesso</strong> e conhecer as informações que possuímos sobre ti.</li>
          <li>Exigir a sua <strong>retificação</strong> caso os dados estejam incorretos ou incompletos.</li>
          <li>Solicitar o <strong>apagamento</strong> dos teus dados (&quot;direito a ser esquecido&quot;), exceto para as informações que temos obrigação legal de reter.</li>
          <li>Solicitar a <strong>portabilidade</strong> dos mesmos.</li>
          <li>Apresentar reclamação perante a autoridade de controlo nacional (CNPD).</li>
        </ol>
      </LegalSection>

      <LegalNote>
        <p>
          Podes exercer estes direitos contactando{" "}
          <a href={`mailto:${email}`}>{email}</a> ou através da{" "}
          <a href="/account/legal">área de conta</a>.
        </p>
      </LegalNote>
    </LegalPage>
  );
}
