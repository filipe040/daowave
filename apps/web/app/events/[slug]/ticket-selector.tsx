'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2, Ticket, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { TicketPresave } from './ticket-presave';
import { isLotAlmostSoldOut } from '@/lib/events/lot-availability';
import { BuyerFeeBreakdownLine } from '@/components/checkout/BuyerFeeBreakdownLine';
import {
  getStaffDashboardPath,
  isStaffAccount,
  staffDashboardLabel,
} from '@/lib/auth/public-nav';

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
  capacity: number;
  soldCount: number;
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
  filterTypeId?: string;
  variant?: 'dark' | 'light';
  presaveEnabled?: boolean;
  userEmail?: string | null;
  userName?: string | null;
}

export function TicketSelector({
  event,
  filterTypeId,
  variant = 'light',
  presaveEnabled = true,
  userEmail,
  userName,
}: TicketSelectorProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role;
  const hasOrgAccess =
    (session?.user as { hasOrgAccess?: boolean })?.hasOrgAccess === true;
  const isStaff = session ? isStaffAccount(role, hasOrgAccess) : false;
  const staffPath = getStaffDashboardPath(role, hasOrgAccess);

  const [types, setTypes] = useState<TicketType[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [feePreview, setFeePreview] = useState<{
    serviceFeeCents: number;
    feePaidBy: "BUYER" | "ORGANIZER";
    totalCents: number;
  } | null>(null);
  const [loadingFeePreview, setLoadingFeePreview] = useState(false);

  useEffect(() => {
    fetch(`/api/events/${event.slug}/tickets`)
      .then(r => r.json())
      .then(data => {
        if (data.ticketTypes) {
          const filtered = filterTypeId
            ? data.ticketTypes.filter((t: TicketType) => t.id === filterTypeId)
            : data.ticketTypes;
          setTypes(filtered);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingData(false));
  }, [event.slug, filterTypeId]);

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

  const displayTotalCents = feePreview?.totalCents ?? totalCents;
  const serviceFeeCents = feePreview?.serviceFeeCents ?? 0;
  const feePaidBy = feePreview?.feePaidBy ?? "BUYER";

  const cartItems = types.flatMap((type) =>
    type.lots
      .map((lot) => ({
        unitPriceCents: lot.priceCents,
        quantity: quantities[lot.id] || 0,
      }))
      .filter((item) => item.quantity > 0)
  );

  const cartItemsKey = JSON.stringify(cartItems);

  useEffect(() => {
    if (cartItems.length === 0) {
      setFeePreview(null);
      return;
    }

    const controller = new AbortController();
    setLoadingFeePreview(true);

    const timer = setTimeout(() => {
      fetch(`/api/events/${event.slug}/checkout-preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cartItems }),
        signal: controller.signal,
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!controller.signal.aborted) setFeePreview(data);
        })
        .catch(() => {
          if (!controller.signal.aborted) setFeePreview(null);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoadingFeePreview(false);
        });
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [cartItemsKey, event.slug]);

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
      const orderRes = await fetch('/api/checkout/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          items: items.map(i => ({ ticketLotId: i.ticketLotId, quantity: i.qty }))
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

  const isLight = variant === 'light';
  const shellCls = isLight
    ? 'bg-white rounded-2xl ring-1 ring-black/[0.08] p-6 shadow-sm'
    : 'bg-white/5 backdrop-blur-3xl rounded-[32px] border border-white/10 p-6 sm:p-8 shadow-2xl';
  const titleCls = isLight ? 'text-lg font-bold text-neutral-900 mb-6' : 'text-xl font-bold text-white tracking-tight mb-8';
  const typeTitleCls = isLight ? 'font-bold text-neutral-900 text-[15px]' : 'font-bold text-white text-[15px] uppercase tracking-widest';
  const lotCardCls = isLight
    ? 'bg-neutral-50 rounded-xl p-3 sm:p-4 ring-1 ring-black/[0.06] hover:bg-neutral-100/80 transition-colors'
    : 'bg-white/[0.03] rounded-2xl p-3 sm:p-4 border border-white/5 transition-colors hover:bg-white/[0.05]';
  const lotNameCls = isLight ? 'font-bold text-neutral-900 truncate text-[15px]' : 'font-bold text-white tracking-wide truncate text-[15px]';
  const priceCls = isLight ? 'text-lg font-bold text-neutral-900' : 'text-lg font-bold text-white';
  const qtyBtnCls = isLight
    ? 'w-8 h-8 sm:w-9 sm:h-9 rounded-xl ring-1 ring-black/10 flex items-center justify-center text-neutral-700 disabled:opacity-20 hover:bg-neutral-100 active:scale-95 transition-all text-base sm:text-lg font-bold'
    : 'w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-white/10 flex items-center justify-center text-white disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white/10 active:scale-95 transition-all text-base sm:text-lg';
  const qtyNumCls = isLight ? 'w-5 sm:w-6 text-center font-bold text-sm sm:text-base text-neutral-900' : 'w-5 sm:w-6 text-center font-bold text-sm sm:text-base text-white';
  const checkoutBtnCls = isLight
    ? 'w-full h-12 rounded-xl bg-gradient-to-r from-[#00a0e3] to-[#0090cc] text-white font-bold text-[15px] hover:opacity-95 transition-all disabled:opacity-40 shadow-md shadow-[#00a0e3]/25'
    : 'w-full h-14 rounded-2xl bg-white text-black font-bold text-[15px] hover:bg-white/90 shadow-[0_12px_40px_rgba(255,255,255,0.15)] transition-all hover:-translate-y-0.5';

  if (loadingData) {
    return (
      <div className={`${shellCls} text-center flex flex-col items-center justify-center py-12`}>
        <Loader2 className={`h-8 w-8 animate-spin mb-4 ${isLight ? 'text-neutral-400' : 'text-white/50'}`} />
        <p className={`text-sm font-medium ${isLight ? 'text-neutral-400' : 'text-white/40'}`}>A procurar bilhetes...</p>
      </div>
    );
  }

  if (types.length === 0) {
    if (presaveEnabled) {
      return (
        <TicketPresave
          eventSlug={event.slug}
          variant={variant}
          userEmail={userEmail}
          userName={userName}
        />
      );
    }
    return (
      <div className={`${shellCls} text-center py-8`}>
        <p className={`text-sm ${isLight ? 'text-neutral-400' : 'text-white/40'}`}>Nenhum lote disponível no momento.</p>
      </div>
    );
  }

  return (
    <div data-testid="event-ticket-selector" className={shellCls}>
      <h2 className={titleCls}>
        {filterTypeId ? 'Bilhetes' : 'Escolher Bilhetes'}
      </h2>

      <div className="space-y-6 mb-8">
        {types.map((type) => (
          <div key={type.id} className="space-y-4">
            {!filterTypeId && (
              <div className="flex items-center gap-2 mb-2">
                <Ticket className={`h-4 w-4 ${isLight ? 'text-neutral-500' : 'text-white/70'}`} />
                <h3 className={typeTitleCls}>{type.name}</h3>
                {type.requiresSeat && (
                  <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-zinc-500/15 text-zinc-500 border border-white/10 rounded-md" title="Lugar atribuído na entrada">
                    Sala marcada
                  </span>
                )}
              </div>
            )}

            {type.description && !filterTypeId && (
              <p className={`text-[13px] mb-3 ${isLight ? 'text-neutral-500' : 'text-white/70'}`}>{type.description}</p>
            )}

            <div className="space-y-3">
              {type.lots.map((lot) => {
                const quantity = quantities[lot.id] || 0;
                const available = lot.available;

                return (
                  <div key={lot.id} className={lotCardCls}>
                    <div className="flex items-center justify-between gap-2 sm:gap-4">
                      <div className="min-w-0 flex-1">
                        <h4 className={lotNameCls}>{lot.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <p className={priceCls}>
                            {formatCurrency(lot.priceCents, "EUR")}
                          </p>
                          {isLotAlmostSoldOut(lot.available, lot.capacity, lot.soldCount) && (
                            <span className="text-[10px] font-bold uppercase text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">Quase a esgotar</span>
                          )}
                        </div>
                      </div>

                      {available > 0 && lot.isAvailable ? (
                        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
                          <button
                            onClick={() => updateQuantity(lot.id, -1, available, type.perUserLimit || lot.perUserLimit)}
                            disabled={quantity === 0}
                            className={qtyBtnCls}
                          >
                            −
                          </button>
                          <span className={qtyNumCls}>{quantity}</span>
                          <button
                            onClick={() => updateQuantity(lot.id, 1, available, type.perUserLimit || lot.perUserLimit)}
                            disabled={quantity >= available || (!!(type.perUserLimit || lot.perUserLimit) && quantity >= (type.perUserLimit || lot.perUserLimit || 0))}
                            className={`${qtyBtnCls} ${isLight ? 'bg-[#00a0e3] text-white ring-0 hover:bg-[#0090cc]' : 'font-bold'}`}
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest bg-red-50 border border-red-200 rounded-lg px-2 py-1 text-center shrink-0">
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
        <div className={`border-t pt-6 mb-6 ${isLight ? 'border-neutral-200' : 'border-white/10 mb-8'}`}>
          <div className="flex justify-between items-end gap-4">
            <div className="min-w-0">
              <p className={`text-[12px] font-bold uppercase tracking-[0.2em] ${isLight ? 'text-neutral-400' : 'text-white/50'}`}>Total</p>
              <BuyerFeeBreakdownLine
                ticketCount={totalItems}
                serviceFeeCents={serviceFeeCents}
                feePaidBy={feePaidBy}
                feeClassName={isLight ? 'text-neutral-500' : 'text-zinc-400'}
                className="mt-1"
              />
              {loadingFeePreview && (
                <p className={`text-[11px] mt-1 ${isLight ? 'text-neutral-400' : 'text-zinc-500'}`}>A calcular taxas…</p>
              )}
            </div>
            <span className={`text-3xl font-bold tracking-tight shrink-0 ${isLight ? 'text-neutral-900' : 'text-white'}`}>
              {formatCurrency(displayTotalCents)}
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

      {isStaff && staffPath ? (
        <div
          className={`rounded-2xl border p-5 text-center ${
            isLight
              ? "border-neutral-200 bg-neutral-50 text-neutral-600"
              : "border-white/10 bg-white/5 text-zinc-400"
          }`}
        >
          <LayoutDashboard className={`h-8 w-8 mx-auto mb-3 ${isLight ? "text-neutral-400" : "text-[#5ec8f8]"}`} />
          <p className="text-sm font-medium mb-4">
            Contas de promotor e administração não podem comprar bilhetes nesta plataforma.
          </p>
          <Link
            href={staffPath}
            className={`inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-bold transition-colors ${
              isLight
                ? "bg-[#00a0e3] text-white hover:bg-[#0090cc]"
                : "bg-white text-black hover:bg-white/90"
            }`}
          >
            Ir para {staffDashboardLabel(role, hasOrgAccess)}
          </Link>
        </div>
      ) : (
      <Button
        type="button"
        data-testid="btn-continue-checkout"
        onClick={handleCheckout}
        disabled={totalItems === 0 || loadingCheckout}
        className={checkoutBtnCls}
        size="lg"
      >
        {loadingCheckout ? 'A processar...' : 'Continuar para Pagamento'}
      </Button>
      )}
    </div>
  );
}
