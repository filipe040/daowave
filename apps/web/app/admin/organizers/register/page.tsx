"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterOrganizerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    brandName: "",
    nif: "",
    vatNumber: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/organizers/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao registar promotor");
      }

      router.push(`/admin/organizers/${data.organizer.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="max-w-3xl mx-auto">
      <div className="mb-8 md:mb-10 space-y-2">
        <Link
          href="/admin/organizers"
          className="text-base md:text-lg text-purple-400 hover:text-purple-300 transition-colors inline-flex items-center gap-2 group mb-4"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          Voltar para Promotores
        </Link>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">Registar Novo Promotor</h1>
        <p className="text-base md:text-lg text-zinc-400">Criar uma nova conta de promotor</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl p-6 md:p-8 lg:p-10 border border-zinc-700/50 shadow-lg space-y-6 md:space-y-8">
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-base md:text-lg font-semibold mb-3 text-zinc-300">Nome Completo *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 md:px-5 py-3 md:py-4 text-base md:text-lg text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
            placeholder="João Silva"
          />
        </div>

        <div>
          <label className="block text-base md:text-lg font-semibold mb-3 text-zinc-300">Email *</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 md:px-5 py-3 md:py-4 text-base md:text-lg text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
            placeholder="joao@example.com"
          />
        </div>

        <div>
          <label className="block text-base md:text-lg font-semibold mb-3 text-zinc-300">Password *</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 md:px-5 py-3 md:py-4 pr-12 md:pr-14 text-base md:text-lg text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
              placeholder="Mínimo 6 caracteres"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors focus:outline-none"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? (
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m13.42 13.42l-3.29-3.29M3 3l18 18" />
                </svg>
              ) : (
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-base md:text-lg font-semibold mb-3 text-zinc-300">Nome da Marca/Empresa *</label>
          <input
            type="text"
            required
            value={formData.brandName}
            onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
            className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 md:px-5 py-3 md:py-4 text-base md:text-lg text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
            placeholder="Eventos Premium"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          <div>
            <label className="block text-base md:text-lg font-semibold mb-3 text-zinc-300">NIF</label>
            <input
              type="text"
              value={formData.nif}
              onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
              className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 md:px-5 py-3 md:py-4 text-base md:text-lg text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
              placeholder="123456789"
            />
          </div>

          <div>
            <label className="block text-base md:text-lg font-semibold mb-3 text-zinc-300">VAT Number (UE)</label>
            <input
              type="text"
              value={formData.vatNumber}
              onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
              className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 md:px-5 py-3 md:py-4 text-base md:text-lg text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
              placeholder="PT123456789"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 md:gap-6 pt-6 md:pt-8">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-6 md:px-8 py-4 md:py-5 rounded-xl text-base md:text-lg font-semibold transition-all disabled:opacity-50 shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105"
          >
            {loading ? "A registar..." : "Registar Promotor"}
          </button>
          <Link
            href="/admin/organizers"
            className="px-6 md:px-8 py-4 md:py-5 rounded-xl border border-zinc-700/50 hover:bg-zinc-700/50 transition-colors text-center text-base md:text-lg font-medium"
          >
            Cancelar
          </Link>
        </div>
      </form>
      </div>
    </div>
  );
}

