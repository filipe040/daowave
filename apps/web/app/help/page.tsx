export default function HelpPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Ajuda</h1>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Como Comprar Bilhetes</h2>
          <ol className="list-decimal list-inside text-zinc-300 space-y-2">
            <li>Navegue pelos eventos disponíveis na página principal</li>
            <li>Selecione o evento desejado</li>
            <li>Escolha o tipo e quantidade de bilhetes</li>
            <li>Preencha as informações dos participantes</li>
            <li>Complete o pagamento</li>
            <li>Receba os bilhetes por email</li>
          </ol>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Gerir os Meus Bilhetes</h2>
          <p className="text-zinc-300 mb-4">
            Após fazer login, pode aceder à secção "Meus Bilhetes" para:
          </p>
          <ul className="list-disc list-inside text-zinc-300 space-y-2">
            <li>Ver todos os seus bilhetes</li>
            <li>Transferir bilhetes para outras pessoas</li>
            <li>Descarregar bilhetes em PDF</li>
            <li>Ver o código QR do bilhete</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Problemas Comuns</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-purple-400 mb-2">Não recebi o email com os bilhetes</h3>
              <p className="text-zinc-300">
                Verifique a pasta de spam. Se ainda não encontrar, contacte o suporte com o número da sua encomenda.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-purple-400 mb-2">O código QR não funciona</h3>
              <p className="text-zinc-300">
                Certifique-se de que está a usar o bilhete correto e que o evento ainda não começou.
                Se o problema persistir, contacte o organizador do evento.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-purple-400 mb-2">Como cancelar uma compra?</h3>
              <p className="text-zinc-300">
                O cancelamento e reembolso dependem da política do evento. Contacte o organizador
                ou o nosso suporte para mais informações.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Para Organizadores</h2>
          <p className="text-zinc-300 mb-4">
            Se é um organizador de eventos e precisa de ajuda para:
          </p>
          <ul className="list-disc list-inside text-zinc-300 space-y-2">
            <li>Criar e gerir eventos</li>
            <li>Configurar tipos de bilhetes e lotes</li>
            <li>Gerir vendas e validações</li>
            <li>Configurar cupões de desconto</li>
          </ul>
          <p className="text-zinc-300 mt-4">
            Aceda à área do organizador após fazer login ou contacte o suporte.
          </p>
        </section>

        <section className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
          <h2 className="text-xl font-semibold mb-4">Ainda Precisa de Ajuda?</h2>
          <p className="text-zinc-300 mb-4">
            Se não encontrou a resposta que procura, não hesite em contactar-nos.
          </p>
          <a
            href="/contact"
            className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition"
          >
            Contactar Suporte
          </a>
        </section>
      </div>
    </div>
  );
}

