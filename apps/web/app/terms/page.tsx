export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Termos e Condições</h1>
      
      <div className="prose prose-invert max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Aceitação dos Termos</h2>
          <p className="text-zinc-300 leading-relaxed">
            Ao aceder e utilizar a plataforma 7even Tickets, aceita estar vinculado a estes Termos e Condições.
            Se não concordar com qualquer parte destes termos, não deve utilizar a plataforma.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Utilização da Plataforma</h2>
          <p className="text-zinc-300 leading-relaxed mb-4">
            A plataforma permite a compra e gestão de bilhetes para eventos. Ao utilizar a plataforma, compromete-se a:
          </p>
          <ul className="list-disc list-inside text-zinc-300 space-y-2">
            <li>Fornecer informações precisas e atualizadas</li>
            <li>Manter a segurança da sua conta</li>
            <li>Utilizar a plataforma apenas para fins legais</li>
            <li>Não tentar aceder a áreas restritas sem autorização</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Compra de Bilhetes</h2>
          <p className="text-zinc-300 leading-relaxed">
            Ao comprar bilhetes através da plataforma, concorda com os termos específicos do evento.
            Os bilhetes são não reembolsáveis, exceto conforme indicado na política de reembolso do evento.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Privacidade</h2>
          <p className="text-zinc-300 leading-relaxed">
            O tratamento dos seus dados pessoais está sujeito à nossa Política de Privacidade.
            Ao utilizar a plataforma, consente com a recolha e utilização dos seus dados conforme descrito na política.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Limitação de Responsabilidade</h2>
          <p className="text-zinc-300 leading-relaxed">
            A 7even Tickets não se responsabiliza por cancelamentos ou alterações de eventos organizados por terceiros.
            Em caso de cancelamento, o reembolso será processado conforme a política do organizador.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Contacto</h2>
          <p className="text-zinc-300 leading-relaxed">
            Para questões sobre estes termos, contacte-nos através do email de suporte.
          </p>
        </section>

        <p className="text-zinc-400 text-sm mt-8">
          Última atualização: {new Date().toLocaleDateString("pt-PT")}
        </p>
      </div>
    </div>
  );
}

