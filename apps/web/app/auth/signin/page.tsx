"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useRef, Suspense } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ── OAuth Error Messages ───────────────────────────────────────────────────

const OAUTH_ERRORS: Record<string, string> = {
  OAuthSignin: "Erro ao iniciar sessão com o fornecedor. Tente novamente.",
  OAuthCallback: "Erro ao processar resposta do fornecedor. Tente novamente.",
  OAuthCreateAccount: "Não foi possível criar a conta. Tente registar-se com email.",
  OAuthAccountNotLinked:
    "Este email já está associado a outra forma de acesso. Use email e palavra-passe.",
  OAuthError: "Erro de autenticação OAuth. Tente novamente.",
  Callback: "Erro na autenticação. Tente novamente.",
  Default: "Erro ao entrar. Por favor, tente novamente.",
};

// ── Google SVG Icon ────────────────────────────────────────────────────────

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// ── Apple SVG Icon ─────────────────────────────────────────────────────────

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

// ── Role-based redirect helper ─────────────────────────────────────────────

function getRoleRedirect(role: string | undefined, from: string): string {
  if (role === "ADMIN") return "/admin";
  if (role === "PROMOTER") return "/promotor";
  // If the `from` param is a safe destination, use it; otherwise home
  if (from && from !== "/" && !from.startsWith("/admin") && !from.startsWith("/promotor")) {
    return from;
  }
  return "/";
}

// ── Main SignIn UI ─────────────────────────────────────────────────────────

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { update: updateSession } = useSession();

  const [credLoading, setCredLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);
  const [oauthTimeout, setOauthTimeout] = useState<"google" | "apple" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const from = searchParams.get("from") || "/";
  const registered = searchParams.get("registered") === "true";
  const passwordReset = searchParams.get("passwordReset") === "true";
  const verified = searchParams.get("verified") === "true";
  const emailNotVerified = searchParams.get("email_not_verified") === "true";
  const rawError = searchParams.get("error");

  // Translate OAuth error codes from NextAuth
  useEffect(() => {
    if (rawError) {
      setError(OAUTH_ERRORS[rawError] ?? OAUTH_ERRORS.Default);
    }
  }, [rawError]);

  // Clear timeout on unmount
  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  // ── OAuth button handler ─────────────────────────────────────────────────
  const handleOAuth = async (provider: "google" | "apple") => {
    setError(null);
    setOauthTimeout(null);
    setOauthLoading(provider);

    // 8-second fallback: if OAuth popup/redirect hangs, show friendly message
    timeoutRef.current = setTimeout(() => {
      setOauthLoading(null);
      setOauthTimeout(provider);
    }, 8000);

    try {
      await signIn(provider, {
        callbackUrl: from === "/" ? "/auth/callback" : from,
      });
      // If we get here without redirect (unlikely), clear loading
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setOauthLoading(null);
    } catch {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setOauthLoading(null);
      setError("Erro ao iniciar ligação com o fornecedor. Tente novamente.");
    }
  };

  // ── Credentials form handler ─────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCredLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = (formData.get("email") as string)?.toLowerCase().trim();
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", { email, password, redirect: false });

      if (result?.error) {
        setError(
          result.error === "CredentialsSignin"
            ? "Email ou palavra-passe incorretos."
            : result.error.includes("Email não verificado")
              ? "Email não verificado. Verifique a sua caixa de entrada."
              : `Erro: ${result.error}`
        );
        setCredLoading(false);
        return;
      }

      await updateSession();
      await new Promise((r) => setTimeout(r, 300));

      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        router.push(getRoleRedirect(data?.user?.role, from));
        router.refresh();
      } catch {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Erro ao fazer login. Tente novamente.");
      setCredLoading(false);
    }
  };

  const anyLoading = credLoading || oauthLoading !== null;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[400px]">

        {/* Logo mark */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
            <div className="grid grid-cols-2 gap-1">
              <span className="h-2 w-2 rounded-sm bg-white/80" />
              <span className="h-2 w-2 rounded-sm bg-white/80" />
              <span className="h-2 w-2 rounded-sm bg-white/80" />
              <span className="h-2 w-2 rounded-sm bg-white/80" />
            </div>
          </div>
          <h1 className="text-[22px] font-semibold text-white tracking-tight">Entrar na Daowave</h1>
          <p className="text-[13px] text-white/45 text-center">
            Aceda à sua conta para gerir bilhetes e eventos.
          </p>
        </div>

        {/* Status banners */}
        {verified && (
          <div className="mb-5 flex items-center gap-2 rounded-2xl border border-green-500/25 bg-green-500/10 px-4 py-3 text-[13px] text-green-400">
            <CheckCircle className="h-4 w-4 shrink-0" />
            Email verificado com sucesso! Pode agora entrar.
          </div>
        )}
        {emailNotVerified && (
          <div className="mb-5 flex items-center gap-2 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-[13px] text-amber-400">
            <XCircle className="h-4 w-4 shrink-0" />
            O seu email ainda não foi verificado. Verifique a sua caixa de entrada.
          </div>
        )}
        {registered && (
          <div className="mb-5 flex items-center gap-2 rounded-2xl border border-green-500/25 bg-green-500/10 px-4 py-3 text-[13px] text-green-400">
            <CheckCircle className="h-4 w-4 shrink-0" />
            Conta criada! Verifique o email para ativar a conta.
          </div>
        )}
        {passwordReset && (
          <div className="mb-5 flex items-center gap-2 rounded-2xl border border-green-500/25 bg-green-500/10 px-4 py-3 text-[13px] text-green-400">
            <CheckCircle className="h-4 w-4 shrink-0" />
            Palavra-passe redefinida com sucesso!
          </div>
        )}
        {error && (
          <div className="mb-5 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-[13px] text-red-400">
            {error}
          </div>
        )}
        {oauthTimeout && (
          <div className="mb-5 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-[13px] text-amber-400">
            A ligação com {oauthTimeout === "apple" ? "a Apple" : "o Google"} está a demorar.{" "}
            <button
              className="underline underline-offset-2 hover:text-amber-300"
              onClick={() => { setOauthTimeout(null); handleOAuth(oauthTimeout); }}
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Card */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-7 shadow-2xl space-y-4">

          {/* Apple OAuth — first by Apple HIG convention */}
          <button
            id="signin-apple"
            onClick={() => handleOAuth("apple")}
            disabled={anyLoading}
            className="relative w-full flex items-center justify-center gap-2.5 rounded-2xl bg-white px-5 py-3 text-[14px] font-semibold text-black transition-all hover:bg-white/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {oauthLoading === "apple" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <AppleIcon className="h-4 w-4" />
            )}
            {oauthLoading === "apple" ? "A ligar..." : "Continuar com Apple"}
          </button>

          {/* Google OAuth */}
          <button
            id="signin-google"
            onClick={() => handleOAuth("google")}
            disabled={anyLoading}
            className="relative w-full flex items-center justify-center gap-2.5 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-[14px] font-medium text-white transition-all hover:bg-white/10 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {oauthLoading === "google" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <GoogleIcon className="h-4 w-4" />
            )}
            {oauthLoading === "google" ? "A ligar..." : "Continuar com Google"}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 py-1">
            <span className="flex-1 border-t border-white/10" />
            <span className="text-[11px] uppercase tracking-wider text-white/30">ou com email</span>
            <span className="flex-1 border-t border-white/10" />
          </div>

          {/* Email / Password form */}
          <form id="signin-form" onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label htmlFor="email" className="block text-[12px] uppercase tracking-wider text-white/40 mb-1.5">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="email@exemplo.com"
                className="h-11 rounded-xl border-white/15 bg-white/5 text-[14px] text-white placeholder:text-white/25 focus-visible:ring-white/20"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label htmlFor="password" className="text-[12px] uppercase tracking-wider text-white/40">
                  Palavra-passe
                </Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-[12px] text-white/40 hover:text-white/70 transition"
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
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="h-11 pr-11 rounded-xl border-white/15 bg-white/5 text-[14px] text-white placeholder:text-white/25 focus-visible:ring-white/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition"
                  aria-label={showPassword ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m13.42 13.42l-3.29-3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <Button
              id="signin-submit"
              type="submit"
              disabled={anyLoading}
              className="w-full h-11 rounded-xl text-[14px] font-semibold bg-white text-black hover:bg-white/90 transition-all disabled:opacity-50 mt-1"
            >
              {credLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  A entrar...
                </span>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-[13px] text-white/40">
          Ainda não tem conta?{" "}
          <Link href="/auth/signup" className="text-white/70 hover:text-white font-medium transition">
            Criar conta
          </Link>
        </p>

        <p className="mt-4 text-center text-[11px] text-white/20 leading-relaxed px-4">
          Ao continuar, aceita os nossos{" "}
          <Link href="/terms" className="underline underline-offset-2 hover:text-white/40">
            Termos
          </Link>{" "}
          e{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-white/40">
            Política de Privacidade
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

// ── Page Export ────────────────────────────────────────────────────────────

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-white/30" />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
