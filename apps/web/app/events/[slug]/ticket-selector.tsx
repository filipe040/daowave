'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Loader2, Ticket } from 'lucide-react';

interface TicketType {
  id: string;
  name: string;
  description: string | null;
  requiresSeat: boolean;
  perUserLimit: number | null;
  minPriceCents: number | null;
  lots: TicketLot[];
}

interface TicketLot {
  id: string;
  name: string;
  priceCents: number;
  available: number;
  isAvailable: boolean;
  perUserLimit: number | null;
}

interface Event {
  id: string;
  title: string;
  slug: string;
}

interface TicketSelectorProps {
  event: Event;
  ticketLots: any[]; // Legacy fallback
}

export function TicketSelector({ event }: TicketSelectorProps) {
  const router = useRouter();
  const [types, setTypes] = useState<TicketType[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/events/${event.slug}/tickets`)
      .then(r => r.json())
      .then(data => {
        if (data.ticketTypes) {
          setTypes(data.ticketTypes);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingData(false));
  }, [event.slug]);

  const updateQuantity = (lotId: string, delta: number, available: number, perUserLimit: number | null) => {
    setQuantities((prev) => {
      const current = prev[lotId] || 0;
      const limit = perUserLimit ? Math.min(perUserLimit, available) : available;
      const newValue = Math.max(0, Math.min(limit, current + delta));
      return { ...prev, [lotId]: newValue };
    });
  };

  const totalItems = Object.values(quantities).reduce((a, b) => a + b, 0);

  // Calculate total price based on selected quantities mapping to lot priceCents
  const totalCents = types.reduce((sum, type) => {
    let typeSum = 0;
    type.lots.forEach(lot => {
      typeSum += (quantities[lot.id] || 0) * lot.priceCents;
    });
    return sum + typeSum;
  }, 0);

  const handleCheckout = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    setCheckoutError(null);

    const items = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([lotId, quantity]) => ({ ticketLotId: lotId, qty: quantity }));

    if (items.length === 0) {
      setCheckoutError('Selecione pelo menos um bilhete.');
      return;
    }

    setLoadingCheckout(true);
    try {
      // 1. Hold the tickets
      const holdRes = await fetch('/api/checkout/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          items,
        }),
      });

      const body = await holdRes.json().catch(() => ({}));
      if (!holdRes.ok) {
        setCheckoutError(body.error || `Erro ${holdRes.status} ao reservar bilhetes`);
        return;
      }

      const holds = body.holds;
      // In a real implementation this would proceed to capturing payment information.
      // For MVP without full stripe integration, we will automatically finalize checkout create

      const orderRes = await fetch('/api/checkout/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          items: items.map(i => ({ ticketLotId: i.ticketLotId, quantity: i.qty })) // Legacy order compatibility
        })
      });

      const orderBody = await orderRes.json().catch(() => ({}));
      if (!orderRes.ok) {
        setCheckoutError(orderBody.error || "Erro ao criar pedido");
        return;
      }

      router.push(`/checkout/${orderBody.orderId}`);
    } catch (error) {
      console.error('Checkout error:', error);
      setCheckoutError('Erro ao processar checkout');
    } finally {
      setLoadingCheckout(false);
    }
  };

  if (loadingData) {
    return (
      <div className="bg-white/5 backdrop-blur-3xl rounded-[32px] border border-white/10 p-12 text-center flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 text-white/50 animate-spin mb-4" />
        <p className="text-white/40 text-sm font-medium">A procurar bilhetes...</p>
      </div>
    );
  }

  if (types.length === 0) {
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

      <div className="space-y-6 mb-8">
        {types.map((type) => (
          <div key={type.id} className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Ticket className="h-4 w-4 text-white/50" />
              <h3 className="font-bold text-white text-sm uppercase tracking-widest">{type.name}</h3>
              {type.requiresSeat && (
                <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-amber-500/20 text-amber-200 border border-amber-500/30 rounded-md">Lugares Marcados</span>
              )}
            </div>

            {type.description && <p className="text-xs text-white/50 mb-3">{type.description}</p>}

            <div className="space-y-3">
              {type.lots.map((lot) => {
                const quantity = quantities[lot.id] || 0;
                const available = lot.available;

                return (
                  <div
                    key={lot.id}
                    className="bg-white/[0.03] rounded-2xl p-3 sm:p-4 border border-white/5 transition-colors hover:bg-white/[0.05]"
                  >
                    <div className="flex items-center justify-between gap-2 sm:gap-4">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-white tracking-wide truncate text-sm">{lot.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-lg font-bold text-white">
                            {formatCurrency(lot.priceCents, "EUR")}
                          </p>
                          {available > 0 && available <= 20 && (
                            <span className="text-[10px] font-bold uppercase text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full ring-1 ring-amber-400/20">Quase a esgotar</span>
                          )}
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      {available > 0 && lot.isAvailable ? (
                        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
                          <button
                            onClick={() => updateQuantity(lot.id, -1, available, type.perUserLimit || lot.perUserLimit)}
                            disabled={quantity === 0}
                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-white/10 flex items-center justify-center text-white disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white/10 active:scale-95 transition-all text-base sm:text-lg"
                          >
                            −
                          </button>
                          <span className="w-5 sm:w-6 text-center font-bold text-sm sm:text-base text-white">
                            {quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(lot.id, 1, available, type.perUserLimit || lot.perUserLimit)}
                            disabled={quantity >= available || (!!(type.perUserLimit || lot.perUserLimit) && quantity >= (type.perUserLimit || lot.perUserLimit || 0))}
                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-white/10 flex items-center justify-center text-white disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white/10 active:scale-95 transition-all text-base sm:text-lg font-bold"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest bg-red-500/10 border border-red-500/20 rounded-lg px-2 py-1 text-center shrink-0">
                          Esgotado
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
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
        disabled={totalItems === 0 || loadingCheckout}
        className="w-full h-14 rounded-2xl bg-white text-black font-bold text-[15px] hover:bg-white/90 shadow-[0_12px_40px_rgba(255,255,255,0.15)] transition-all hover:-translate-y-0.5"
        size="lg"
      >
        {loadingCheckout ? 'A processar...' : 'Continuar para Pagamento'}
      </Button>
    </div>
  );
}
