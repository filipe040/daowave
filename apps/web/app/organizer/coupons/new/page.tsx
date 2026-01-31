"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewCouponPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [events, setEvents] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    eventId: "",
    code: "",
    discountType: "PERCENTAGE",
    discountValue: 10,
    maxUses: "",
    startsAt: "",
    endsAt: "",
  });

  useEffect(() => {
    fetch("/api/promotor/events?select=all")
      .then((res) => res.json())
      .then((data) => {
        if (data.events) setEvents(data.events);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/promotor/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao criar cupão");
      }

      router.push("/organizer/coupons");
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
          href="/organizer/coupons"
          className="text-base md:text-lg text-purple-400 hover:text-purple-300 transition-colors inline-flex items-center gap-2 group mb-4"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          Voltar para Cupões
        </Link>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">Criar Cupão de Desconto</h1>
        <p className="text-base md:text-lg text-zinc-400">Crie um cupão para aumentar as vendas</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl p-6 md:p-8 lg:p-10 border border-zinc-700/50 shadow-lg space-y-6 md:space-y-8">
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-base md:text-lg font-semibold mb-3 text-zinc-300">Evento *</label>
          <select
            required
            value={formData.eventId}
            onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
            className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 md:px-5 py-3 md:py-4 text-base md:text-lg text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
          >
            <option value="">Selecione um evento</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-base md:text-lg font-semibold mb-3 text-zinc-300">Código do Cupão *</label>
          <input
            type="text"
            required
            value={formData.code}
            onChange={(e) =>
              setFormData({
                ...formData,
                code: e.target.value.toUpperCase().replace(/\s/g, ""),
              })
            }
            className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 md:px-5 py-3 md:py-4 text-base md:text-lg text-white font-mono focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
            placeholder="VERAO2025"
            maxLength={20}
          />
          <p className="text-sm text-zinc-500 mt-2">
            Apenas letras maiúsculas e números (sem espaços)
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          <div>
            <label className="block text-base md:text-lg font-semibold mb-3 text-zinc-300">Tipo de Desconto *</label>
            <select
              value={formData.discountType}
              onChange={(e) =>
                setFormData({ ...formData, discountType: e.target.value })
              }
              className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 md:px-5 py-3 md:py-4 text-base md:text-lg text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
            >
              <option value="PERCENTAGE">Percentagem (%)</option>
              <option value="FIXED">Valor Fixo (€)</option>
            </select>
          </div>

          <div>
            <label className="block text-base md:text-lg font-semibold mb-3 text-zinc-300">
              Valor do Desconto *
              {formData.discountType === "PERCENTAGE" ? " (%)" : " (€)"}
            </label>
            <input
              type="number"
              required
              min={formData.discountType === "PERCENTAGE" ? 1 : 0.01}
              max={formData.discountType === "PERCENTAGE" ? 100 : undefined}
              step={formData.discountType === "PERCENTAGE" ? 1 : 0.01}
              value={formData.discountValue}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  discountValue:
                    formData.discountType === "PERCENTAGE"
                      ? parseInt(e.target.value)
                      : parseFloat(e.target.value) * 100,
                })
              }
              className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 md:px-5 py-3 md:py-4 text-base md:text-lg text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
            />
            {formData.discountType === "PERCENTAGE" ? (
              <p className="text-sm text-zinc-500 mt-2">Entre 1% e 100%</p>
            ) : (
              <p className="text-sm text-zinc-500 mt-2">
                Valor em euros (ex: 5.00 = 5€)
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-base md:text-lg font-semibold mb-3 text-zinc-300">
            Limite de Utilizações (opcional)
          </label>
          <input
            type="number"
            min={1}
            value={formData.maxUses}
            onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
            className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 md:px-5 py-3 md:py-4 text-base md:text-lg text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
            placeholder="Deixe em branco para ilimitado"
          />
          <p className="text-sm text-zinc-500 mt-2">
            Número máximo de vezes que o cupão pode ser usado
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          <div>
            <label className="block text-base md:text-lg font-semibold mb-3 text-zinc-300">Data de Início *</label>
            <input
              type="datetime-local"
              required
              value={formData.startsAt}
              onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
              className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 md:px-5 py-3 md:py-4 text-base md:text-lg text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-base md:text-lg font-semibold mb-3 text-zinc-300">Data de Fim *</label>
            <input
              type="datetime-local"
              required
              value={formData.endsAt}
              onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
              className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 md:px-5 py-3 md:py-4 text-base md:text-lg text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 md:gap-6 pt-6 md:pt-8">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-6 md:px-8 py-4 md:py-5 rounded-xl text-base md:text-lg font-semibold transition-all disabled:opacity-50 shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105"
          >
            {loading ? "A criar..." : "Criar Cupão"}
          </button>
          <Link
            href="/organizer/coupons"
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

