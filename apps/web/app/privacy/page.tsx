export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Política de Privacidade</h1>
      
      <div className="prose prose-invert max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Recolha de Dados</h2>
          <p className="text-zinc-300 leading-relaxed">
            Recolhemos informações que nos fornece diretamente, incluindo nome, email, e informações de pagamento
            quando compra bilhetes ou cria uma conta.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Utilização dos Dados</h2>
          <p className="text-zinc-300 leading-relaxed mb-4">
            Utilizamos os seus dados para:
          </p>
          <ul className="list-disc list-inside text-zinc-300 space-y-2">
            <li>Processar e gerir as suas compras</li>
            <li>Enviar confirmações e bilhetes</li>
            <li>Comunicar sobre eventos e atualizações</li>
            <li>Melhorar os nossos serviços</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Partilha de Dados</h2>
          <p className="text-zinc-300 leading-relaxed">
            Partilhamos os seus dados apenas com organizadores de eventos para os quais comprou bilhetes,
            e com prestadores de serviços que nos ajudam a operar a plataforma (processamento de pagamentos, etc.).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Segurança</h2>
          <p className="text-zinc-300 leading-relaxed">
            Implementamos medidas de segurança técnicas e organizacionais para proteger os seus dados pessoais
            contra acesso não autorizado, alteração, divulgação ou destruição.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Os Seus Direitos</h2>
          <p className="text-zinc-300 leading-relaxed mb-4">
            Tem o direito de:
          </p>
          <ul className="list-disc list-inside text-zinc-300 space-y-2">
            <li>Aceder aos seus dados pessoais</li>
            <li>Retificar dados incorretos</li>
            <li>Solicitar a eliminação dos seus dados</li>
            <li>Opor-se ao tratamento dos seus dados</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Cookies</h2>
          <p className="text-zinc-300 leading-relaxed">
            Utilizamos cookies para melhorar a sua experiência na plataforma. Pode gerir as preferências de cookies
            nas definições do seu navegador.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Contacto</h2>
          <p className="text-zinc-300 leading-relaxed">
            Para questões sobre privacidade ou para exercer os seus direitos, contacte-nos através do email de suporte.
          </p>
        </section>

        <p className="text-zinc-400 text-sm mt-8">
          Última atualização: {new Date().toLocaleDateString("pt-PT")}
        </p>
      </div>
    </div>
  );
}

