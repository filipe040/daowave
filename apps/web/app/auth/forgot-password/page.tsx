"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao solicitar recuperação");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-20">
        <div className="mx-auto max-w-md">
          <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl border border-zinc-700/50 p-8 md:p-10 lg:p-12 shadow-xl text-center">
            <div className="text-6xl mb-6">📧</div>
            <h1 className="text-2xl md:text-3xl font-bold mb-4 text-green-400">Email enviado!</h1>
            <p className="text-zinc-400 mb-2">
              Enviámos um email para <strong className="text-white">{email}</strong> com instruções para recuperar a sua palavra-passe.
            </p>
            <p className="text-sm text-zinc-500 mt-4">
              Verifique a sua caixa de entrada e a pasta de spam.
            </p>
            <Link
              href="/auth/signin"
              className="mt-6 inline-block text-purple-400 hover:text-purple-300 font-semibold transition-colors"
            >
              Voltar para login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-20">
      <div className="mx-auto max-w-md">
        <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl border border-zinc-700/50 p-8 md:p-10 lg:p-12 shadow-xl">
          <div className="mb-8 md:mb-10 text-center space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              Recuperar palavra-passe
            </h1>
            <p className="text-base md:text-lg text-zinc-400">
              Digite o seu email e enviaremos instruções para recuperar a sua conta
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-sm md:text-base text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
            <div>
              <label htmlFor="email" className="mb-3 block text-base md:text-lg font-semibold text-zinc-300">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-zinc-700/50 bg-zinc-900/50 px-4 md:px-5 py-3 md:py-4 text-base md:text-lg text-white transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                placeholder="Email"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-6 md:px-8 py-4 md:py-5 text-base md:text-lg font-bold text-white shadow-lg shadow-purple-500/30 transition-all hover:scale-105 hover:shadow-xl hover:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 active:scale-95"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  A enviar...
                </span>
              ) : (
                "Enviar instruções"
              )}
            </button>
          </form>

          <div className="mt-6 md:mt-8 text-center">
            <Link href="/auth/signin" className="text-sm md:text-base text-purple-400 hover:text-purple-300 font-semibold transition-colors">
              ← Voltar para login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

