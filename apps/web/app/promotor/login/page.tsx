"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PromoterLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Credenciais inválidas");
        setLoading(false);
        return;
      }

      // Check user role and redirect
      try {
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();
        const userRole = sessionData?.user?.role;

        if (userRole === "PROMOTER" || userRole === "ADMIN") {
          router.push("/promotor");
        } else {
          setError("Acesso restrito a promotores");
          setLoading(false);
        }
      } catch (err) {
        router.push("/promotor");
      }
    } catch (error) {
      setError("Erro ao fazer login");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-12">
      {/* Logo and Header */}
      <div className="text-center mb-12 sm:mb-16">
        {/* Grid Icon */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 border-2 border-white flex items-center justify-center">
          <div className="grid grid-cols-2 gap-1 p-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white"></div>
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white"></div>
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white"></div>
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white"></div>
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2">
          5IVE TICKETS.
        </h1>
        <p className="text-xs sm:text-sm text-white italic">
          ACESSO RESTRITO AO ESTÚDIO
        </p>
      </div>

      {/* Login Form */}
      <div className="w-full max-w-md">
        <h2 className="text-lg sm:text-xl font-semibold text-white mb-8 uppercase tracking-wide">
          CREDENCIAIS
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {/* Email Field */}
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 flex items-center text-white">
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="EMAIL@ESTUDIO"
              required
              className="w-full bg-transparent border-0 border-b-2 border-white/30 text-white placeholder-white/50 pl-8 sm:pl-10 pr-4 py-3 sm:py-4 focus:outline-none focus:border-white transition-colors uppercase text-sm sm:text-base"
            />
          </div>

          {/* Password Field */}
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 flex items-center text-white">
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="CHAVE SEGURA"
              required
              className="w-full bg-transparent border-0 border-b-2 border-white/30 text-white placeholder-white/50 pl-8 sm:pl-10 pr-10 sm:pr-12 py-3 sm:py-4 focus:outline-none focus:border-white transition-colors uppercase text-sm sm:text-base"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-0 bottom-0 flex items-center text-white/70 hover:text-white transition-colors pr-2"
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                {showPassword ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.736m0 0L21 21"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                )}
              </svg>
            </button>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black px-6 py-4 sm:py-5 rounded-lg font-bold text-sm sm:text-base uppercase tracking-wide hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? "A ENTRAR..." : "ENTRAR NO SISTEMA"}
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </form>

        {/* Footer Links */}
        <div className="flex justify-between items-center mt-8 sm:mt-10 text-sm sm:text-base">
          <Link
            href="/auth/forgot-password"
            className="text-white/70 hover:text-white transition-colors uppercase tracking-wide"
          >
            RECUPERAR CHAVE
          </Link>
          <Link
            href="/auth/signup"
            className="text-white/70 hover:text-white transition-colors uppercase tracking-wide"
          >
            NOVAS CREDENCIAIS
          </Link>
        </div>
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2 text-xs sm:text-sm text-white/50">
        <div className="flex flex-col">
          <span>5IVE TICKETS TERMINAL V4.0.0</span>
          <span>ENCRYPTED TUNNEL ACTIVE</span>
        </div>
        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-white/30"></div>
      </div>
    </div>
  );
}
