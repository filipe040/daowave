"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";

export default function AccountError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[account] error:", error);
  }, [error]);

  const linkClass = buttonVariants({ variant: "ghost", size: "sm" });

  return (
    <div className="rounded-2xl border border-zinc-800 bg-background/50 p-8 text-center">
      <h2 className="text-lg font-semibold text-foreground">Algo correu mal</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Ocorreu um erro ao carregar esta página. Verifica se a base de dados está a correr e se as migrações foram aplicadas.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset} variant="outline" size="sm" data-testid="account-error-retry">
          Tentar novamente
        </Button>
        <Link href="/account" className={linkClass}>
          Voltar ao resumo
        </Link>
        <Link href="/" className={linkClass}>
          Ir para início
        </Link>
      </div>
    </div>
  );
}
