import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
    title: "Política de Reembolsos — GoPass Bilhetes",
    description:
        "Consulta a nossa política de reembolsos e cancelamentos para compras de bilhetes na plataforma GoPass.",
};

export default function PoliticaReembolsosPage() {
    return (
        <div className="min-h-screen mesh-gradient text-neutral-900">
            <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-[13px] text-neutral-500 hover:text-violet-600 font-semibold transition mb-10"
                >
                    <ArrowLeft className="h-4 w-4" /> Início
                </Link>

                <div className="text-[11px] uppercase tracking-wider text-violet-600 font-bold mb-2">Legal</div>
                <h1 className="text-[32px] sm:text-[40px] font-black text-neutral-900 leading-tight mb-2">
                    Política de Reembolsos
                </h1>
                <p className="text-[13px] text-neutral-500 mb-10">Última atualização: Fevereiro 2025</p>

                <div className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-md space-y-8 text-[14px] sm:text-[15px] text-neutral-700 leading-relaxed">
                    <section>
                        <h2 className="text-[16px] font-bold text-neutral-900 mb-3">1. Condições Gerais</h2>
                        <p>
                            A GoPass atua como plataforma intermediária entre promotores de eventos e compradores
                            de bilhetes. A política de reembolsos aplica-se a todas as compras efetuadas na
                            plataforma.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-[16px] font-bold text-neutral-900 mb-3">2. Prazo para Pedido de Reembolso</h2>
                        <p>
                            Os reembolsos podem ser solicitados até <strong className="text-neutral-900">48 horas antes</strong>{" "}
                            do início do evento. Pedidos fora deste prazo não são elegíveis, salvo em casos de
                            cancelamento do evento pelo promotor.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-[16px] font-bold text-neutral-900 mb-3">3. Cancelamento do Evento</h2>
                        <p>
                            Se um evento for cancelado pelo promotor, todos os compradores são automaticamente
                            reembolsados na totalidade, sem necessidade de pedido. O processamento ocorre em{" "}
                            <strong className="text-neutral-900">5 a 10 dias úteis</strong>.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-[16px] font-bold text-neutral-900 mb-3">4. Processo de Reembolso</h2>
                        <ol className="list-decimal list-inside space-y-2">
                            <li>Envia um email para <a href="mailto:suporte@gopass.pt" className="text-violet-600 font-semibold hover:underline">suporte@gopass.pt</a> com o número de ordem e motivo.</li>
                            <li>A equipa analisa o pedido dentro de 24–48h.</li>
                            <li>O reembolso é processado para o método de pagamento original.</li>
                        </ol>
                    </section>

                    <section>
                        <h2 className="text-[16px] font-bold text-neutral-900 mb-3">5. Taxas de Serviço</h2>
                        <p>
                            As taxas de serviço da plataforma não são reembolsáveis, exceto em caso de
                            cancelamento total do evento. Em reembolsos parciais, as taxas são calculadas
                            proporcionalmente.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-[16px] font-bold text-neutral-900 mb-3">6. Transferência de Bilhetes</h2>
                        <p>
                            Como alternativa ao reembolso, podes transferir o teu bilhete para outro utilizador
                            diretamente na plataforma, na secção &quot;Os Meus Bilhetes&quot;, sem custos adicionais.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-[16px] font-bold text-neutral-900 mb-3">7. Contacto</h2>
                        <p>
                            Para questões relacionadas com reembolsos:{" "}
                            <a href="mailto:suporte@gopass.pt" className="text-violet-600 font-semibold hover:underline">
                                suporte@gopass.pt
                            </a>
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
