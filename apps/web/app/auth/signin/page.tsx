"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, Suspense } from "react";
import { useSession } from "next-auth/react";

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
        // Force session update
        await updateSession();
        
        // Send login notification (async, don't block)
        fetch("/api/auth/login-notification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }).catch((err) => {
          console.error("Error sending login notification:", err);
        });

        // Wait a moment for session to be established
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Get user role from session to redirect appropriately
        try {
          const sessionRes = await fetch("/api/auth/session");
          const sessionData = await sessionRes.json();
          const userRole = sessionData?.user?.role;

          let redirectUrl = from;
          if (from === "/" || from === "/admin" || from.startsWith("/admin")) {
            if (userRole === "ADMIN") {
              redirectUrl = "/admin";
            } else if (userRole === "PROMOTER") {
              redirectUrl = "/promotor";
            } else {
              redirectUrl = "/";
            }
          }

          // Use router.push instead of window.location.href to preserve session
          router.push(redirectUrl);
          router.refresh(); // Force refresh to update session
        } catch (err) {
          router.push("/");
          router.refresh();
        }
      }
    } catch (err) {
      setError("Erro ao fazer login");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Login Card */}
      <div className="w-full max-w-md">
        <div className="bg-zinc-900 rounded-2xl p-8 md:p-10 border border-purple-500/30 shadow-2xl shadow-purple-500/10">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white uppercase mb-2">
              WELCOME BACK
            </h1>
            <p className="text-sm md:text-base text-white uppercase tracking-wide">
              ENTER YOUR DETAILS TO ACCESS YOUR ACCOUNT
            </p>
          </div>

          {/* Success/Error Messages */}
          {verified && (
            <div className="mb-6 rounded-lg border border-green-500/50 bg-green-500/10 p-4 text-sm text-green-400">
              ✅ Email verificado com sucesso! Por favor, faça login.
            </div>
          )}

          {emailNotVerified && (
            <div className="mb-6 rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-400">
              ❌ O seu email ainda não foi verificado. Por favor, verifique a sua caixa de entrada.
            </div>
          )}

          {registered && (
            <div className="mb-6 rounded-lg border border-green-500/50 bg-green-500/10 p-4 text-sm text-green-400">
              ✅ Conta criada com sucesso! Verifique o seu email para ativar a conta.
            </div>
          )}

          {passwordReset && (
            <div className="mb-6 rounded-lg border border-green-500/50 bg-green-500/10 p-4 text-sm text-green-400">
              ✅ Palavra-passe redefinida com sucesso! Por favor, faça login.
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-white text-sm uppercase tracking-wide mb-2">
                EMAIL ADDRESS
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full rounded-lg border border-purple-500/50 bg-blue-900/20 px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                placeholder="name@example.com"
              />
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-white text-sm uppercase tracking-wide">
                  PASSWORD
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-purple-400 hover:text-purple-300 text-sm uppercase tracking-wide transition-colors"
                >
                  FORGOT?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full rounded-lg border border-purple-500/50 bg-blue-900/20 px-4 py-3 pr-12 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m13.42 13.42l-3.29-3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-bold text-sm uppercase tracking-wide px-6 py-3 rounded-lg hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  LOGGING IN...
                </span>
              ) : (
                <>
                  LOGIN
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Separator */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-700"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-zinc-900 text-white text-sm uppercase tracking-wide">
                OR CONTINUE WITH
              </span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-3">
            {/* Google Button */}
            <button
              type="button"
              onClick={() => signIn('google', { callbackUrl: from })}
              className="w-full bg-white text-black font-medium text-sm rounded-lg px-6 py-3 hover:bg-zinc-100 transition-colors flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>SIGN IN WITH GOOGLE</span>
            </button>

            {/* Apple Button */}
            <button
              type="button"
              onClick={() => signIn('apple', { callbackUrl: from })}
              className="w-full bg-black text-white font-medium text-sm rounded-lg px-6 py-3 hover:bg-zinc-900 transition-colors flex items-center justify-center gap-3 border border-zinc-800"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              <span>SIGN IN WITH APPLE</span>
            </button>
          </div>
        </div>

        {/* Footer Link */}
        <div className="mt-8 text-center">
          <p className="text-white text-sm">
            DON'T HAVE AN ACCOUNT?{" "}
            <Link href="/auth/signup" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
              JOIN 5IVE TICKETS
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-zinc-900 rounded-2xl p-8 md:p-10 border border-purple-500/30">
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-white uppercase mb-2">
                WELCOME BACK
              </h1>
              <p className="text-sm text-white uppercase">A carregar...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
