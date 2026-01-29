export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="max-w-2xl text-center p-6">
        <h1 className="text-4xl font-bold mb-4">404 — Página não encontrada</h1>
        <p className="text-lg text-muted mb-6">
          Desculpa, não conseguimos encontrar a página que procuras.
        </p>
        <div className="flex justify-center gap-3">
          <a href="/" className="px-4 py-2 rounded bg-primary text-white">
            Ir para a página inicial
          </a>
          <a href="/events" className="px-4 py-2 rounded border border-secondary text-white">
            Ver eventos
          </a>
        </div>
      </div>
    </div>
  );
}

