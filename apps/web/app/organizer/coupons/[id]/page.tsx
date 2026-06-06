"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function EditCouponPage() {
  const router = useRouter();
  const params = useParams();
  const couponId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    isActive: true,
  });

  useEffect(() => {
    // Load events
    fetch("/api/promotor/events?select=all")
      .then((res) => res.json())
      .then((data) => {
        if (data.events) setEvents(data.events);
      });

    // Load coupon
    fetch(`/api/promotor/coupons/${couponId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.coupon) {
          setFormData({
            eventId: data.coupon.eventId,
            code: data.coupon.code,
            discountType: data.coupon.discountType,
            discountValue: data.coupon.discountType === "PERCENTAGE" 
              ? data.coupon.discountValue 
              : data.coupon.discountValue / 100,
            maxUses: data.coupon.maxUses?.toString() || "",
            startsAt: new Date(data.coupon.startsAt).toISOString().slice(0, 16),
            endsAt: new Date(data.coupon.endsAt).toISOString().slice(0, 16),
            isActive: data.coupon.isActive,
          });
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Erro ao carregar cupão");
        setLoading(false);
      });
  }, [couponId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/promotor/coupons/${couponId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          discountValue: formData.discountType === "PERCENTAGE"
            ? formData.discountValue
            : formData.discountValue * 100,
          maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao atualizar cupão");
      }

      router.push("/organizer/coupons");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-neutral-500">A carregar...</div>
      </div>
    );
  }

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
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">Editar Cupão</h1>
          <p className="text-base md:text-lg text-neutral-500">Atualizar cupão de desconto</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-neutral-100/60 backdrop-blur-sm rounded-2xl p-6 md:p-8 lg:p-10 border border-neutral-200 shadow-lg space-y-6 md:space-y-8">
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-600 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

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
            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 md:px-5 py-3 md:py-4 text-base md:text-lg text-neutral-900 font-mono focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
            placeholder="VERAO2025"
            maxLength={20}
            readOnly
          />
          <p className="text-sm text-neutral-500 mt-2">O código não pode ser alterado</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          <div>
            <label className="block text-base md:text-lg font-semibold mb-3 text-zinc-300">Tipo de Desconto *</label>
            <select
              value={formData.discountType}
              onChange={(e) =>
                setFormData({ ...formData, discountType: e.target.value })
              }
              className="public-input md:px-5 md:py-4 text-base md:text-lg"
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
                  discountValue: parseFloat(e.target.value) || 0,
                })
              }
              className="public-input md:px-5 md:py-4 text-base md:text-lg"
            />
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
            className="public-input md:px-5 md:py-4 text-base md:text-lg"
            placeholder="Deixe em branco para ilimitado"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          <div>
            <label className="block text-base md:text-lg font-semibold mb-3 text-zinc-300">Data de Início *</label>
            <input
              type="datetime-local"
              required
              value={formData.startsAt}
              onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
              className="public-input md:px-5 md:py-4 text-base md:text-lg"
            />
          </div>

          <div>
            <label className="block text-base md:text-lg font-semibold mb-3 text-zinc-300">Data de Fim *</label>
            <input
              type="datetime-local"
              required
              value={formData.endsAt}
              onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
              className="public-input md:px-5 md:py-4 text-base md:text-lg"
            />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-5 h-5 rounded border-neutral-200 bg-neutral-50 text-purple-500 focus:ring-purple-500 focus:ring-2"
            />
            <span className="text-base md:text-lg text-zinc-300">Cupão ativo</span>
          </label>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 md:gap-6 pt-6 md:pt-8">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-violet-600 hover:bg-violet-700 px-6 md:px-8 py-4 md:py-5 rounded-xl text-base md:text-lg font-semibold transition-all disabled:opacity-50 shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105"
          >
            {saving ? "A guardar..." : "Guardar Alterações"}
          </button>
          <Link
            href="/organizer/coupons"
            className="px-6 md:px-8 py-4 md:py-5 rounded-xl border border-neutral-200 hover:bg-neutral-100 transition-colors text-center text-base md:text-lg font-medium"
          >
            Cancelar
          </Link>
        </div>
      </form>
      </div>
    </div>
  );
}

