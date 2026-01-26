export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="text-4xl font-bold mb-8">Contacto</h1>
      
      <div className="bg-zinc-900 rounded-lg p-8 border border-zinc-800">
        <h2 className="text-2xl font-semibold mb-4">Entre em Contacto</h2>
        
        <p className="text-zinc-300 mb-6">
          Tem questões ou precisa de ajuda? Estamos aqui para ajudar.
        </p>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-purple-400 mb-2">Email de Suporte</h3>
            <p className="text-zinc-300">
              <a href="mailto:support@7eventickets.pt" className="hover:text-white transition">
                support@7eventickets.pt
              </a>
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-purple-400 mb-2">Horário de Atendimento</h3>
            <p className="text-zinc-300">
              Segunda a Sexta: 9h00 - 18h00<br />
              Sábado e Domingo: Fechado
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-purple-400 mb-2">Para Organizadores</h3>
            <p className="text-zinc-300">
              Se é um organizador de eventos e precisa de ajuda, contacte-nos através do email acima
              ou aceda à área do organizador após fazer login.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

