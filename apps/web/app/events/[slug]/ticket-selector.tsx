'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface TicketLot {
  id: string;
  name: string;
  priceCents: number;
  currency: string;
  quantityTotal: number;
  quantitySold: number;
}

interface Event {
  id: string;
  title: string;
}

interface TicketSelectorProps {
  event: Event;
  ticketLots: TicketLot[];
}

export function TicketSelector({ event, ticketLots }: TicketSelectorProps) {
  const router = useRouter();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const updateQuantity = (lotId: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[lotId] || 0;
      const lot = ticketLots.find((l) => l.id === lotId);
      const available = lot ? lot.quantityTotal - lot.quantitySold : 0;
      const newValue = Math.max(0, Math.min(available, current + delta));
      return { ...prev, [lotId]: newValue };
    });
  };

  const totalItems = Object.values(quantities).reduce((a, b) => a + b, 0);
  const totalCents = ticketLots.reduce((sum, lot) => {
    return sum + (quantities[lot.id] || 0) * lot.priceCents;
  }, 0);

  const handleCheckout = async () => {
    if (totalItems === 0) return;

    setLoading(true);
    try {
      const items = Object.entries(quantities)
        .filter(([_, qty]) => qty > 0)
        .map(([lotId, quantity]) => ({ ticketLotId: lotId, quantity }));

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          items,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Erro ao processar checkout');
        return;
      }

      const data = await response.json();
      router.push(`/checkout/${data.orderId}`);
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Erro ao processar checkout');
    } finally {
      setLoading(false);
    }
  };

  if (ticketLots.length === 0) {
    return (
      <div className="bg-slate-50 rounded-lg p-6 text-center">
        <p className="text-slate-500">Nenhum lote disponível no momento.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-slate-900 mb-6">
        Selecionar Bilhetes
      </h2>

      <div className="space-y-4 mb-6">
        {ticketLots.map((lot) => {
          const quantity = quantities[lot.id] || 0;
          const available = lot.quantityTotal - lot.quantitySold;

          return (
            <div
              key={lot.id}
              className="bg-white rounded-lg p-4 border border-slate-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{lot.name}</h3>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {formatCurrency(lot.priceCents, lot.currency)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">
                    {available} disponíveis
                  </p>
                </div>
              </div>

              {available > 0 ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateQuantity(lot.id, -1)}
                    disabled={quantity === 0}
                    className="w-10 h-10 rounded-lg border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100"
                  >
                    −
                  </button>
                  <span className="w-12 text-center font-semibold">
                    {quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(lot.id, 1)}
                    disabled={quantity >= available}
                    className="w-10 h-10 rounded-lg border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100"
                  >
                    +
                  </button>
                </div>
              ) : (
                <p className="text-sm text-red-600 font-semibold">
                  Esgotado
                </p>
              )}
            </div>
          );
        })}
      </div>

      {totalItems > 0 && (
        <div className="border-t border-slate-300 pt-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-600">Total ({totalItems} bilhetes)</span>
            <span className="text-2xl font-bold text-slate-900">
              {formatCurrency(totalCents)}
            </span>
          </div>
        </div>
      )}

      <Button
        onClick={handleCheckout}
        disabled={totalItems === 0 || loading}
        className="w-full"
        size="lg"
      >
        {loading ? 'A processar...' : 'Continuar para Pagamento'}
      </Button>
    </div>
  );
}
