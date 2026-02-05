 "use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { update: updateSession } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const from = searchParams.get("from") || "/";
  const registered = searchParams.get("registered") === "true";
  const passwordReset = searchParams.get("passwordReset") === "true";
  const verified = searchParams.get("verified") === "true";
  const emailNotVerified = searchParams.get("email_not_verified") === "true";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = (formData.get("email") as string)?.toLowerCase().trim();
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === "CredentialsSignin") {
          setError("Email ou palavra-passe incorretos.");
        } else if (result.error.includes("Email não verificado")) {
          setError("Email não verificado. Por favor, verifique o seu email.");
        } else {
          setError(`Erro ao fazer login: ${result.error}`);
        }
        setLoading(false);
      } else {
        // Atualizar sessão
        await updateSession();

        // Notificação de login (assíncrona)
        fetch("/api/auth/login-notification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }).catch((err) => {
          console.error("Error sending login notification:", err);
        });

        // Pequeno delay para garantir que a sessão está propagada
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Obter role do utilizador para redireciono adequado
        try {
          const sessionRes = await fetch("/api/auth/session");
          const sessionData = await sessionRes.json();
          const userRole = sessionData?.user?.role;

          let redirectUrl = from;
          if (from === "/" || from === "/admin" || from.startsWith("/admin") || from === "/promotor") {
            if (userRole === "ADMIN" || userRole === "PROMOTER") {
              redirectUrl = "/promotor";
            } else {
              redirectUrl = "/";
            }
          }

          router.push(redirectUrl);
          router.refresh();
        } catch {
          router.push("/");
          router.refresh();
        }
      }
    } catch {
      setError("Erro ao fazer login");
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-20">
      <div className="mx-auto max-w-md">
        <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl border border-zinc-700/50 p-8 md:p-10 lg:p-12 shadow-xl">
          <div className="mb-8 md:mb-10 text-center space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              Entrar
            </h1>
            <p className="text-base md:text-lg text-zinc-400">
              Aceda à sua conta para gerir bilhetes e eventos.
            </p>
          </div>

          {verified && (
            <div className="mb-6 rounded-xl border border-green-500/50 bg-green-500/10 p-4 text-sm md:text-base text-green-400 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 shrink-0" />
              <span>Email verificado com sucesso! Por favor, faça login.</span>
            </div>
          )}

          {emailNotVerified && (
            <div className="mb-6 rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-sm md:text-base text-red-400 flex items-center gap-2">
              <XCircle className="h-5 w-5 shrink-0" />
              <span>O seu email ainda não foi verificado. Por favor, verifique a sua caixa de entrada.</span>
            </div>
          )}

          {registered && (
            <div className="mb-6 rounded-xl border border-green-500/50 bg-green-500/10 p-4 text-sm md:text-base text-green-400 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 shrink-0" />
              <span>Conta criada com sucesso! Verifique o seu email para ativar a conta.</span>
            </div>
          )}

          {passwordReset && (
            <div className="mb-6 rounded-xl border border-green-500/50 bg-green-500/10 p-4 text-sm md:text-base text-green-400 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 shrink-0" />
              <span>Palavra-passe redefinida com sucesso! Por favor, faça login.</span>
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-sm md:text-base text-red-400">
              {error}
            </div>
          )}

          <form data-testid="signin-form" onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base md:text-sm font-semibold text-zinc-300">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="name@example.com"
                className="h-11 md:h-12 text-base md:text-sm"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-base md:text-sm font-semibold text-zinc-300">
                  Palavra-passe
                </Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm md:text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors"
                >
                  Esqueceu-se?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="pr-12 h-11 md:h-12 text-base md:text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m13.42 13.42l-3.29-3.29M3 3l18 18"
                      />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 md:h-12 text-sm md:text-base font-bold uppercase tracking-wide flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  A entrar...
                </span>
              ) : (
                <>
                  Entrar
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </Button>
          </form>


        </div>

        <div className="mt-8 text-center">
          <p className="text-zinc-300 text-sm md:text-base">
            Ainda não tem conta?{" "}
            <Link
              href="/auth/signup"
              className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
            >
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-20">
          <div className="mx-auto max-w-md">
            <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl border border-zinc-700/50 p-8 md:p-10 lg:p-12 shadow-xl text-center">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-2">
                Entrar
              </h1>
              <p className="text-sm md:text-base text-zinc-400">A carregar...</p>
            </div>
          </div>
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
