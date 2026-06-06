"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface TicketLotFormProps {
  eventId: string;
  ticketTypeId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TicketLotForm({
  eventId,
  ticketTypeId,
  onClose,
  onSuccess,
}: TicketLotFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    startsAt: "",
    endsAt: "",
    stockTotal: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/promotor/events/${eventId}/tickets/lots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketTypeId,
          ...formData,
          price: Math.round(parseFloat(formData.price) * 100), // Convert to cents
          stockTotal: parseInt(formData.stockTotal),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao criar lote");
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-50 rounded-2xl border border-neutral-200 p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Criar Lote de Bilhetes</h2>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-900 transition-colors p-1"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-zinc-300">
              Nome do Lote *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="public-input rounded-lg py-3"
              placeholder="Ex: Lote 1, Promoção, Black Friday"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-zinc-300">
              Preço (€) *
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="public-input rounded-lg py-3"
              placeholder="0.00"
            />
            <p className="text-xs text-neutral-500 mt-1">
              O preço pode ser diferente do preço base do tipo de bilhete
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-zinc-300">
                Data de Início *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.startsAt}
                onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                className="public-input rounded-lg py-3"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-zinc-300">
                Data de Fim *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.endsAt}
                onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
                className="public-input rounded-lg py-3"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-zinc-300">
              Quantidade Total *
            </label>
            <input
              type="number"
              required
              min="1"
              value={formData.stockTotal}
              onChange={(e) => setFormData({ ...formData, stockTotal: e.target.value })}
              className="public-input rounded-lg py-3"
              placeholder="100"
            />
            <p className="text-xs text-neutral-500 mt-1">
              Número total de bilhetes disponíveis neste lote
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold transition-all disabled:opacity-50"
            >
              {loading ? "A criar..." : "Criar Lote"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-100 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

