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
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

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

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  const handleCheckout = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    setCheckoutError(null);

    const items = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([lotId, quantity]) => ({ ticketLotId: lotId, quantity }));

    if (items.length === 0 || items.every((i) => i.quantity === 0)) {
      setCheckoutError('Selecione pelo menos um bilhete.');
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      const invalid = items.find((item) => !UUID_REGEX.test(item.ticketLotId));
      if (invalid) {
        const msg = `ticketLotId must be TicketLot.id (UUID). Got: "${invalid.ticketLotId}". Check that event.ticketLots include id.`;
        setCheckoutError(msg);
        return;
      }
    }

    setLoading(true);
    try {
      const response = await fetch('/api/checkout/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          items,
        }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setCheckoutError((body.error as string) || `Erro ${response.status} ao processar checkout`);
        return;
      }

      const orderId = body.orderId;
      if (!orderId) {
        setCheckoutError('Resposta do servidor sem orderId');
        return;
      }
      router.push(`/checkout/${orderId}`);
    } catch (error) {
      console.error('Checkout error:', error);
      setCheckoutError('Erro ao processar checkout');
    } finally {
      setLoading(false);
    }
  };

  if (ticketLots.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-[24px] border border-white/10 p-8 text-center">
        <p className="text-white/40 text-sm">Nenhum lote disponível no momento.</p>
      </div>
    );
  }

  return (
    <div data-testid="event-ticket-selector" className="bg-white/5 backdrop-blur-3xl rounded-[32px] border border-white/10 p-6 sm:p-8 shadow-2xl">
      <h2 className="text-xl font-bold text-white tracking-tight mb-8">
        Escolher Bilhetes
      </h2>

      <div className="space-y-4 mb-8">
        {ticketLots.map((lot) => {
          const quantity = quantities[lot.id] || 0;
          const available = lot.quantityTotal - lot.quantitySold;

          return (
            <div
              key={lot.id}
              className="bg-white/[0.03] rounded-2xl p-5 border border-white/5 transition-colors hover:bg-white/[0.05]"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="min-w-0">
                  <h3 className="font-bold text-white tracking-wide truncate">{lot.name}</h3>
                  <p className="text-2xl font-bold text-white mt-1">
                    {formatCurrency(lot.priceCents, lot.currency)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] uppercase font-bold text-white/40 tracking-wider">
                    {available} disponíveis
                  </div>
                </div>
              </div>

              {available > 0 ? (
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => updateQuantity(lot.id, -1)}
                    disabled={quantity === 0}
                    className="w-11 h-11 rounded-xl border border-white/10 flex items-center justify-center text-white disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white/10 active:scale-95 transition-all text-xl"
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-bold text-lg text-white">
                    {quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(lot.id, 1)}
                    disabled={quantity >= available}
                    className="w-11 h-11 rounded-xl border border-white/10 flex items-center justify-center text-white disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white/10 active:scale-95 transition-all text-xl font-bold"
                  >
                    +
                  </button>
                </div>
              ) : (
                <p className="text-[12px] font-bold text-red-500/80 uppercase tracking-widest bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-center">
                  Esgotado
                </p>
              )}
            </div>
          );
        })}
      </div>

      {totalItems > 0 && (
        <div className="border-t border-white/10 pt-6 mb-8">
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-[11px] font-bold text-white/30 uppercase tracking-[0.2em]">Total</p>
              <p className="text-sm text-white/50">{totalItems} bilhetes selecionados</p>
            </div>
            <span className="text-3xl font-bold text-white tracking-tight">
              {formatCurrency(totalCents)}
            </span>
          </div>
        </div>
      )}

      {checkoutError && (
        <div
          data-testid="checkout-error"
          className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400 font-medium leading-relaxed"
          role="alert"
        >
          <p className="font-bold uppercase tracking-wider text-[10px] mb-1">Falha no checkout</p>
          {checkoutError}
        </div>
      )}

      <Button
        type="button"
        data-testid="btn-continue-checkout"
        onClick={handleCheckout}
        disabled={totalItems === 0 || loading}
        className="w-full h-14 rounded-2xl bg-white text-black font-bold text-[15px] hover:bg-white/90 shadow-[0_12px_40px_rgba(255,255,255,0.15)] transition-all hover:-translate-y-0.5"
        size="lg"
      >
        {loading ? 'A processar...' : 'Continuar para Pagamento'}
      </Button>
    </div>
  );
}
