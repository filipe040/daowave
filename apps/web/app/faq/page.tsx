import { PublicPage } from "@/components/public/public-page";

export const metadata = {
    title: "Perguntas Frequentes — LivePass Bilhetes",
    description: "Respostas às perguntas mais comuns sobre compra de bilhetes, reembolsos, check-in e gestão de eventos na LivePass.",
};

const FAQS = [
    {
        category: "Compra de Bilhetes",
        items: [
            {
                q: "Como compro um bilhete?",
                a: "Escolhe o evento, seleciona o tipo de bilhete e quantidade, e procede ao pagamento com cartão (Visa, Mastercard, Amex). Recebes a confirmação por email com o QR code. MB Way e Multibanco serão disponibilizados em breve.",
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
                a: "Não. O QR code no telemóvel ou o PDF no email são suficientes para entrar no evento.",
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
        <PublicPage
            title="Perguntas frequentes"
            subtitle="Não encontras o que procuras? Contacta support@livepass.pt"
            backHref="/"
        >
            <div className="space-y-8 max-w-3xl">
                {FAQS.map((section) => (
                    <div key={section.category}>
                        <h2 className="text-[11px] uppercase tracking-wider text-zinc-500 font-bold mb-3">
                            {section.category}
                        </h2>
                        <div className="space-y-2">
                            {section.items.map((item) => (
                                <details
                                    key={item.q}
                                    className="group rounded-2xl border border-white/10 bg-[#14141f] open:border-[#00a0e3]/30 transition-all"
                                >
                                    <summary className="cursor-pointer px-4 sm:px-5 py-4 text-sm font-semibold text-white flex items-start justify-between gap-4 select-none list-none [&::-webkit-details-marker]:hidden">
                                        {item.q}
                                        <span className="shrink-0 text-zinc-500 group-open:text-[#5ec8f8] group-open:rotate-180 transition-transform duration-200">
                                            ↓
                                        </span>
                                    </summary>
                                    <p className="px-4 sm:px-5 pb-4 text-sm text-zinc-400 leading-relaxed border-t border-white/5 pt-3">
                                        {item.a}
                                    </p>
                                </details>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </PublicPage>
    );
}
