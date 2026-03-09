export default function CookiesPage() {
    return (
        <>
            <h1>Política de Cookies</h1>

            <p>De forma a tornar a utilização do website o mais eficiente e útil possível para o adquirente de bilhetes, este website utiliza cookies.</p>

            <h3>O que são cookies?</h3>
            <p>Cookies são breves fragmentos de texto descarregados para o dispositivo do utilizador assim que este interage com o nosso site, agilizando tarefas cruciais da navegação.</p>

            <h3>Painel de Cookies Utilizados</h3>

            <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm whitespace-nowrap">
                    <thead className="uppercase tracking-wider border-b-2 border-white/10">
                        <tr>
                            <th scope="col" className="px-6 py-4">Categoria</th>
                            <th scope="col" className="px-6 py-4">Descrição e Finalidade do Cookie</th>
                            <th scope="col" className="px-6 py-4">Duração Típica</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b border-white/10">
                            <th scope="row" className="px-6 py-4 font-medium whitespace-normal">
                                Essenciais (Estritamente Necessários)
                            </th>
                            <td className="px-6 py-4 whitespace-normal">
                                Requeridos e imprescindíveis para que o website funcione a nível técnico (inclui sessão, tokens de login, carrinho de compras seguro). <strong>O site não opera corretamente sem estes cookies</strong> pelo que não requerem permissão prévia do utilizador.
                            </td>
                            <td className="px-6 py-4 whitespace-normal">
                                Expira no termo da sessão
                            </td>
                        </tr>
                        <tr className="border-b border-white/10">
                            <th scope="row" className="px-6 py-4 font-medium whitespace-normal">
                                Analíticos ou de Desempenho (Google Analytics)
                            </th>
                            <td className="px-6 py-4 whitespace-normal">
                                São utilizados unicamente a título de medição interna para avaliarmos dados de visitas e tráfego. Agregam as métricas de forma anónima sem capacidade para extrair a identificação individual direta do utilizador. Requerem o teu consentimento prévio.
                            </td>
                            <td className="px-6 py-4 whitespace-normal">
                                1 dia até 2 anos
                            </td>
                        </tr>
                        <tr className="border-b border-white/10">
                            <th scope="row" className="px-6 py-4 font-medium whitespace-normal">
                                Cookies de Marketing
                            </th>
                            <td className="px-6 py-4 whitespace-normal">
                                Utilizados com o propósito restrito de exibir publicidade relevante (ex: campanhas e retargeting), prevenindo repetições de anúncios indesejados da nossa marca noutros websites. Requerem consentimento.
                            </td>
                            <td className="px-6 py-4 whitespace-normal">
                                Variável consoante a campanha
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <p className="mt-8">Podes gerir, a qualquer momento, as tuas preferências de consentimento através do painel de <strong>Gestão/Definições de Cookies</strong> disponibilizado no nosso site.</p>
        </>
    );
}
