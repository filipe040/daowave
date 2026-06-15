"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="public-shell min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center public-card p-8 space-y-6">
        <h1 className="text-2xl font-bold text-white">Algo correu mal</h1>
        <p className="text-zinc-400 text-sm">
          Ocorreu um erro inesperado. Podes tentar novamente ou voltar à página inicial.
        </p>
        {process.env.NODE_ENV === "development" && (
          <p className="text-xs text-red-400 break-all">{error.message}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={reset}
            className="dash-btn-primary"
          >
            Tentar novamente
          </button>
          <Link href="/" className="dash-btn-secondary inline-flex justify-center">
            Página inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
