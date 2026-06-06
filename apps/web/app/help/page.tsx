export default function HelpPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl mesh-gradient min-h-screen">
      <h1 className="text-4xl font-black text-neutral-900 mb-8">Ajuda</h1>

      <div className="space-y-8">
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">Como Comprar Bilhetes</h2>
          <ol className="list-decimal list-inside text-neutral-600 space-y-2">
            <li>Navegue pelos eventos disponíveis na página principal</li>
            <li>Selecione o evento desejado</li>
            <li>Escolha o tipo e quantidade de bilhetes</li>
            <li>Preencha as informações dos participantes</li>
            <li>Complete o pagamento</li>
            <li>Receba os bilhetes por email</li>
          </ol>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">Gerir os Meus Bilhetes</h2>
          <p className="text-neutral-600 mb-4">
            Após fazer login, pode aceder à secção &quot;Meus Bilhetes&quot; para:
          </p>
          <ul className="list-disc list-inside text-neutral-600 space-y-2">
            <li>Ver todos os seus bilhetes</li>
            <li>Transferir bilhetes para outras pessoas</li>
            <li>Descarregar bilhetes em PDF</li>
            <li>Ver o código QR do bilhete</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">Problemas Comuns</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-violet-700 mb-2">Não recebi o email com os bilhetes</h3>
              <p className="text-neutral-600">
                We&apos;re here to help! If you have any questions, please contact us at <a href="mailto:support@example.com" className="text-blue-600 hover:underline">support@example.com</a>.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-violet-700 mb-2">O código QR não funciona</h3>
              <p className="text-neutral-600">
                Certifique-se de que está a usar o bilhete correto e que o evento ainda não começou.
                Se o problema persistir, contacte o organizador do evento.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-violet-700 mb-2">Como cancelar uma compra?</h3>
              <p className="text-neutral-600">
                O cancelamento e reembolso dependem da política do evento. Contacte o organizador
                ou o nosso suporte para mais informações.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">Para Organizadores</h2>
          <p className="text-neutral-600 mb-4">
            Se é um organizador de eventos e precisa de ajuda para:
          </p>
          <ul className="list-disc list-inside text-neutral-600 space-y-2">
            <li>Criar e gerir eventos</li>
            <li>Configurar tipos de bilhetes e lotes</li>
            <li>Gerir vendas e validações</li>
            <li>Configurar cupões de desconto</li>
          </ul>
          <p className="text-neutral-600 mt-4">
            Aceda à área do organizador após fazer login ou contacte o suporte.
          </p>
        </section>

        <section className="rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 p-6 shadow-lg">
          <h2 className="text-xl font-bold text-white mb-4">Ainda Precisa de Ajuda?</h2>
          <p className="text-white/85 mb-4">
            Se não encontrou a resposta que procura, não hesite em contactar-nos.
          </p>
          <a
            href="/contact"
            className="inline-block bg-white text-violet-700 font-bold px-6 py-2.5 rounded-xl hover:bg-white/95 transition shadow-md"
          >
            Contactar Suporte
          </a>
        </section>
      </div>
    </div>
  );
}

