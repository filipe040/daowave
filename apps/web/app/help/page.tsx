import Link from "next/link";
import { PublicPage, PublicCard } from "@/components/public/public-page";

export default function HelpPage() {
  return (
    <PublicPage
      title="Ajuda"
      subtitle="Guia rápido para comprar bilhetes e gerir a tua conta."
    >
      <div className="space-y-5 sm:space-y-6">
        <PublicCard>
          <h2 className="text-lg font-bold text-white mb-4">Como comprar bilhetes</h2>
          <ol className="list-decimal list-inside text-zinc-400 space-y-2 text-sm sm:text-base">
            <li>Explora eventos na página principal ou em /events</li>
            <li>Seleciona o evento e escolhe o lote</li>
            <li>Preenche os dados e paga com cartão (Visa, Mastercard)</li>
            <li>Recebe o bilhete digital com QR code</li>
          </ol>
        </PublicCard>

        <PublicCard>
          <h2 className="text-lg font-bold text-white mb-4">Os meus bilhetes</h2>
          <p className="text-zinc-400 text-sm mb-3">Após login, em &quot;Os meus bilhetes&quot; podes:</p>
          <ul className="list-disc list-inside text-zinc-400 space-y-2 text-sm">
            <li>Ver todos os bilhetes ativos</li>
            <li>Abrir o QR code no telemóvel</li>
            <li>Transferir bilhetes (quando permitido)</li>
          </ul>
        </PublicCard>

        <PublicCard>
          <h2 className="text-lg font-bold text-white mb-4">Problemas comuns</h2>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold text-[#5ec8f8] mb-1">Não recebi o email</h3>
              <p className="text-zinc-400">
                Verifica a pasta de spam. Se persistir,{" "}
                <Link href="/contact" className="text-[#00a0e3] hover:underline">
                  contacta o suporte
                </Link>
                .
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-[#5ec8f8] mb-1">QR code não funciona</h3>
              <p className="text-zinc-400">
                Confirma que estás no evento certo e que o bilhete ainda está válido.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-[#5ec8f8] mb-1">Cancelamento</h3>
              <p className="text-zinc-400">
                Depende da política do evento. Consulta{" "}
                <Link href="/politica-reembolsos" className="text-[#00a0e3] hover:underline">
                  reembolsos
                </Link>
                .
              </p>
            </div>
          </div>
        </PublicCard>

        <PublicCard>
          <h2 className="text-lg font-bold text-white mb-4">Mais respostas</h2>
          <p className="text-zinc-400 text-sm mb-4">
            Consulta as perguntas frequentes sobre pagamentos, reembolsos e bilhetes digitais.
          </p>
          <Link
            href="/faq"
            className="inline-flex text-sm font-bold text-[#00a0e3] hover:text-[#5ec8f8] transition-colors"
          >
            Ver FAQ completo →
          </Link>
        </PublicCard>

        <div className="rounded-2xl border border-[#00a0e3]/30 bg-gradient-to-br from-[#0066aa]/30 to-[#14141f] p-6 sm:p-8 text-center">
          <h2 className="text-lg font-bold text-white">Precisas de mais ajuda?</h2>
          <p className="mt-2 text-sm text-zinc-400">A nossa equipa responde o mais rápido possível.</p>
          <Link
            href="/contact"
            className="inline-flex mt-5 rounded-full bg-[#00a0e3] px-6 py-3 text-sm font-bold text-white hover:bg-[#0090cc] transition-colors"
          >
            Contactar suporte
          </Link>
        </div>
      </div>
    </PublicPage>
  );
}
