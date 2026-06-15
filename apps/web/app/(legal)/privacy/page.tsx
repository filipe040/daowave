import { getCompanyInfo } from "@/lib/company";

export default function PrivacyPage() {
  const { name, nif, address, email } = getCompanyInfo();
  const entityName = name || "LivePass";
  const entityNif = nif || "— (a preencher em COMPANY_NIF)";
  const entityAddress = address || "— (a preencher em COMPANY_ADDRESS)";
  const contactEmail = email;

  return (
    <>
      <h1>Política de Privacidade</h1>

      <p>
        A empresa <strong>{entityName}</strong> reconhece a importância de proteger os dados pessoais,
        cumprindo estritamente as obrigações impostas pelo Regulamento Geral sobre a Proteção de Dados (RGPD).
      </p>

      <h3>1. Responsável pelo Tratamento</h3>
      <ul>
        <li><strong>Entidade:</strong> {entityName}</li>
        <li><strong>NIF:</strong> {entityNif}</li>
        <li><strong>Morada:</strong> {entityAddress}</li>
        <li><strong>Contacto:</strong> <a href={`mailto:${contactEmail}`}>{contactEmail}</a></li>
      </ul>

      <h3>2. Recolha e Finalidade do Tratamento</h3>
      <p>O tratamento dos teus dados tem como fundamento jurídico a execução do contrato (compra do bilhete) e o cumprimento de obrigações legais, incluindo:</p>
      <ul>
        <li><strong>Dados de Identificação e Contacto</strong> (Nome e Email): Recolhidos para efetuar a validação, entrega dos bilhetes digitais e envio de comunicações operacionais relativas ao evento específico.</li>
        <li><strong>Dados de Faturação</strong> (Nome, Morada e NIF): Exigidos estritamente para o cumprimento de preceitos legais e fiscais perante a Autoridade Tributária.</li>
      </ul>

      <h3>3. Prazo de Conservação dos Dados</h3>
      <p>Mantemos os dados de identificação pelo tempo em que a tua conta no portal se mantiver ativa ou durante o ciclo de vida do evento em causa. Relativamente aos <strong>dados de faturação</strong>, conservá-los-emos pelo período legalmente exigido de 10 anos, tal como determinado pelo artigo 130.º do Código do IRS.</p>

      <h3>4. Partilha de Dados</h3>
      <p>Os dados recolhidos poderão ser acedidos pelo Promotor/Organizador responsável pelo evento unicamente para fins logísticos do mesmo (e.g. validação de entradas na porta) e por serviços parceiros de processamento de pagamentos. Em caso algum venderemos ou cederemos a tua base de dados a entidades terceiras com finalidades de marketing ou publicidade não solicitada.</p>

      <h3>5. Os Teus Direitos</h3>
      <p>De acordo com o RGPD, tens o direito de:</p>
      <ol>
        <li>Solicitar o <strong>acesso</strong> e conhecer as informações que possuímos sobre ti.</li>
        <li>Exigir a sua <strong>retificação</strong> caso os dados estejam incorretos ou incompletos.</li>
        <li>Solicitar o <strong>apagamento</strong> dos teus dados (&quot;direito a ser esquecido&quot;), exceto para as informações que temos a obrigação legal de reter.</li>
        <li>Solicitar a <strong>portabilidade</strong> dos mesmos.</li>
        <li>Apresentar reclamação perante a autoridade de controlo nacional (CNPD).</li>
      </ol>

      <p>
        Podes exercer estes direitos contactando{" "}
        <a href={`mailto:${contactEmail}`}>{contactEmail}</a> ou através da{" "}
        <a href="/account/legal">área de conta</a>.
      </p>
    </>
  );
}
