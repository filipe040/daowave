import { getCompanyInfo } from "@/lib/company";
import Link from "next/link";

export default function TermsPage() {
    const { name, nif, address, email } = getCompanyInfo();

    return (
        <>
            <h1>Termos e Condições de Uso e Venda</h1>

            <p><strong>Bem-vindo ao LivePass!</strong></p>
            <p>Estes Termos e Condições regulam a utilização do nosso website e o processo de compra de bilhetes digitais aplicável a todos os utilizadores.</p>

            <h3>1. Informações da Empresa</h3>
            <ul>
                <li><strong>Nome:</strong> {name}</li>
                {nif && <li><strong>NIF:</strong> {nif}</li>}
                {address && <li><strong>Sede:</strong> {address}</li>}
                <li><strong>Email de Contacto:</strong> <a href={`mailto:${email}`}>{email}</a></li>
            </ul>

            <h3>2. Processo de Compra</h3>
            <p>A aquisição de bilhetes na nossa plataforma envolve os seguintes passos:</p>
            <ol>
                <li>Seleção do evento e tipo de bilhete desejado.</li>
                <li>Preenchimento dos dados do comprador e dos participantes (quando aplicável).</li>
                <li>Aceitação expressa destes Termos e Condições e da Política de Privacidade.</li>
                <li>Pagamento da encomenda através de um dos meios disponibilizados.</li>
            </ol>
            <p>A encomenda só é considerada válida e finalizada após a confirmação de boa cobrança.</p>

            <h3>3. Preços e Taxas</h3>
            <p>Todos os preços apresentados no website incluem o IVA à taxa legal em vigor. O montante final a pagar inclui o preço do bilhete e, quando aplicável, as respetivas <strong>taxas de serviço e/ou de processamento</strong>. Estas taxas serão claramente discriminadas no momento do checkout, antes de finalizar o pagamento.</p>

            <h3>4. Métodos de Pagamento</h3>
            <p>Disponibilizamos métodos de pagamento estritamente seguros. O processamento dos dados associados aos pagamentos é efetuado por prestadores de serviços financeiros externos e certificados de acordo com as mais exigentes normas de segurança da indústria, garantindo a integridade dos teus dados.</p>

            <h3>5. Entrega de Bilhetes Digitais</h3>
            <p>Após a confirmação do pagamento, os bilhetes serão emitidos exclusivamente em formato digital. Os mesmos serão enviados para o endereço de e-mail fornecido no momento da compra e ficarão igualmente disponíveis para download através da tua área reservada de cliente no nosso website.</p>

            <h3>6. Direito de Livre Resolução e Reembolsos</h3>
            <p>Ao abrigo da alínea l) do artigo 17.º do DL n.º 24/2014, de 14 de fevereiro, o direito de livre resolução de 14 dias <strong>não se aplica</strong> a bilhetes para eventos com data específica.</p>

            <p>
              As condições de reembolso, cancelamento e devolução estão detalhadas na nossa{" "}
              <Link href="/politica-reembolsos" className="text-[#00a0e3] underline">Política de Reembolsos</Link>.
              Em caso de cancelamento do evento pelo promotor, procederemos à restituição conforme essa política e as comunicações do organizador.
            </p>
        </>
    );
}
