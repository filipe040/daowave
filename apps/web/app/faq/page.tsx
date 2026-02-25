import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
    title: "Perguntas Frequentes — EasyTicket Bilhetes",
    description: "Respostas às perguntas mais comuns sobre compra de bilhetes, reembolsos, check-in e gestão de eventos na EasyTicket.",
};

const FAQS = [
    {
        category: "Compra de Bilhetes",
        items: [
            {
                q: "Como compro um bilhete?",
                a: "Escolhe o evento, seleciona o tipo de bilhete e quantidade, e procede ao pagamento. Aceitamos cartão Visa, Mastercard e MB Way. Recebes a confirmação por email com o QR code.",
            },
            {
                q: "Posso comprar bilhetes para outra pessoa?",
                a: "Sim. Tens a opção de introduzir os dados do destinatário na compra. Também podes transferir um bilhete depois de comprado na secção 'Os Meus Bilhetes'.",
            },
            {
                q: "Os meus dados de pagamento estão seguros?",
                a: "Sim. Os pagamentos são processados pela Stripe, líder mundial em pagamentos online. Nunca armazenamos os dados do teu cartão.",
            },
        ],
    },
    {
        category: "QR Code e Entrada",
        items: [
            {
                q: "Onde encontro o meu QR code?",
                a: "Na secção 'Os Meus Bilhetes' após login. Cada bilhete tem um QR code único que deves apresentar na entrada do evento.",
            },
            {
                q: "Preciso de imprimir o bilhete?",
                a: "Não. O QR code no telemóvel é suficiente. Podes até usar o teu bilhete na Apple Wallet ou Google Wallet.",
            },
        ],
    },
    {
        category: "Reembolsos e Cancelamentos",
        items: [
            {
                q: "Posso pedir reembolso?",
                a: "Sim, dentro das condições definidas na nossa Política de Reembolsos. Em geral, pedidos feitos mais de 48h antes do evento são elegíveis. O reembolso é processado dentro de 5–10 dias úteis.",
            },
            {
                q: "O evento foi cancelado. O que acontece?",
                a: "Se o promotor cancelar o evento, serás notificado por email e o reembolso integral é processado automaticamente.",
            },
        ],
    },
    {
        category: "Para Promotores",
        items: [
            {
                q: "Como crio um evento na plataforma?",
                a: "Regista-te como promotor, cria a tua organização e cria o primeiro evento no painel de gestão. O evento fica ativo após revisão.",
            },
            {
                q: "Quanto custam as comissões?",
                a: "A estrutura de comissões é transparente e comunicada durante o registo. Contacta-nos para saber mais.",
            },
        ],
    },
];

export default function FAQPage() {
    return (
        <div className="min-h-screen bg-black text-white">
            <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-[13px] text-white/50 hover:text-white transition mb-10"
                >
                    <ArrowLeft className="h-4 w-4" /> Início
                </Link>

                <div className="text-[11px] uppercase tracking-wider text-white/40 mb-2">Apoio</div>
                <h1 className="text-[32px] sm:text-[40px] font-semibold text-white leading-tight mb-4">
                    Perguntas Frequentes
                </h1>
                <p className="text-[15px] text-white/50 mb-12">
                    Não encontras o que procuras?{" "}
                    <a href="mailto:suporte@daowave.pt" className="text-white/80 hover:text-white underline underline-offset-2">
                        Contacta-nos
                    </a>
                    .
                </p>

                <div className="space-y-10">
                    {FAQS.map((section) => (
                        <div key={section.category}>
                            <h2 className="text-[12px] uppercase tracking-wider text-white/35 mb-4">
                                {section.category}
                            </h2>
                            <div className="space-y-3">
                                {section.items.map((item) => (
                                    <details
                                        key={item.q}
                                        className="group rounded-2xl border border-white/10 bg-white/4 open:bg-white/6 transition-colors"
                                    >
                                        <summary className="cursor-pointer px-5 py-4 text-[14px] font-medium text-white/80 group-open:text-white flex items-start justify-between gap-4 select-none">
                                            {item.q}
                                            <span className="shrink-0 text-white/30 group-open:text-white/60 group-open:rotate-180 transition-transform duration-200 mt-0.5">
                                                ↓
                                            </span>
                                        </summary>
                                        <p className="px-5 pb-5 text-[13px] text-white/55 leading-relaxed border-t border-white/8 pt-3">
                                            {item.a}
                                        </p>
                                    </details>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
