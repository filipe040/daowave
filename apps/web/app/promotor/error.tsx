"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";

export default function PromotorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[promotor] error boundary:", error);
  }, [error]);

  const linkClass = buttonVariants({ variant: "ghost", size: "sm" });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-background/50 p-8 text-center">
        <h2 className="text-lg font-semibold text-foreground">Erro ao carregar</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Ocorreu um erro na área do promotor. Tenta novamente ou inicia sessão de novo.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={reset} variant="outline" size="sm" data-testid="promotor-error-retry">
            Tentar novamente
          </Button>
          <Link href="/promotor/login" className={linkClass}>
            Ir para login
          </Link>
          <Link href="/" className={linkClass}>
            Início
          </Link>
        </div>
      </div>
    </div>
  );
}
