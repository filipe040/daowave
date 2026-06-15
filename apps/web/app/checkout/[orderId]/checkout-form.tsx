'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import {
  Tag,
  CheckCircle2,
  XCircle,
  Loader2,
  Lock,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { PaymentMethodSelector, type PaymentMethod } from '@/components/checkout/PaymentMethodSelector';
import { PaymentProcessingOverlay } from '@/components/checkout/PaymentProcessingOverlay';
import { OrderStripeCheckout } from '@/components/checkout/OrderStripeCheckout';

interface CheckoutFormProps {
  orderId: string;
  subtotalCents: number;
  serviceFeeCents: number;
  totalCents: number;
  feePaidBy: "BUYER" | "ORGANIZER";
  eventId: string;
  stripePaymentsEnabled?: boolean;
  mockPaymentsEnabled?: boolean;
}

interface AppliedCoupon {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  discountCents: number;
  finalCents: number;
}

function formatEuro(cents: number) {
  return `${(cents / 100).toFixed(2).replace('.', ',')}€`;
}

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

function generateMultibancoRef() {
  const entity = '12345';
  const reference = String(Math.floor(100000000 + Math.random() * 900000000));
  return { entity, reference };
}

export function CheckoutForm({
  orderId,
  subtotalCents,
  serviceFeeCents,
  totalCents,
  feePaidBy,
  eventId,
  stripePaymentsEnabled = false,
  mockPaymentsEnabled = true,
}: CheckoutFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [formData, setFormData] = useState({
    buyerName: '',
    buyerEmail: '',
    buyerPhone: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    mbwayPhone: '',
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [multibancoRef] = useState(generateMultibancoRef);

  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  const couponDiscount = appliedCoupon?.discountCents ?? 0;
  const effectiveTotal = totalCents - couponDiscount;
  const useStripeCard = stripePaymentsEnabled && paymentMethod === 'card';
  const canMockPay = mockPaymentsEnabled && !useStripeCard;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    setAppliedCoupon(null);

    try {
      const res = await fetch('/api/checkout/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.trim().toUpperCase(),
          eventId,
          totalCents: subtotalCents,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCouponError(data.error || 'Cupão inválido');
      } else {
        setAppliedCoupon({ ...data.coupon, discountCents: data.discountCents, finalCents: data.finalCents });
      }
    } catch {
      setCouponError('Erro ao verificar cupão. Tente novamente.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const validatePaymentFields = (): string | null => {
    if (paymentMethod === 'card') {
      const digits = formData.cardNumber.replace(/\s/g, '');
      if (!digits) return null; // mock: campos opcionais se vazios
      if (digits.length < 16) return 'Introduza um número de cartão válido.';
      if (!/^\d{2}\/\d{2}$/.test(formData.cardExpiry)) return 'Validade inválida (MM/AA).';
      if (formData.cardCvc.length < 3) return 'CVC inválido.';
    }
    if (paymentMethod === 'mbway') {
      const phone = formData.mbwayPhone.replace(/\s/g, '');
      if (!phone) return null;
      if (!/^(\+351|351)?9\d{8}$/.test(phone)) {
        return 'Introduza um número MB WAY válido (9XXXXXXXX).';
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setSubmitError('');

    if (!formData.buyerName.trim() || !formData.buyerEmail.trim()) {
      setSubmitError('Preencha o nome e email.');
      return;
    }
    if (!acceptedTerms) {
      setSubmitError('Aceite os Termos e Condições para continuar.');
      return;
    }

    const paymentError = validatePaymentFields();
    if (paymentError) {
      setSubmitError(paymentError);
      return;
    }

    if (!canMockPay && !useStripeCard) {
      setSubmitError('Este método de pagamento estará disponível em breve. Use cartão.');
      return;
    }

    setLoading(true);

    try {
      // Simular tempo de processamento do gateway
      await new Promise((r) => setTimeout(r, 2200));

      const response = await fetch(`/api/checkout/${orderId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerName: formData.buyerName.trim(),
          buyerEmail: formData.buyerEmail.trim(),
          buyerPhone: formData.buyerPhone.trim() || formData.mbwayPhone.trim() || undefined,
          paymentMock: true,
          couponId: appliedCoupon?.id,
          discountCents: appliedCoupon?.discountCents ?? 0,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setSubmitError(error.error || 'Erro ao processar pagamento.');
        return;
      }

      router.push(`/orders/${orderId}/success`);
    } catch (error) {
      console.error('Payment error:', error);
      setSubmitError('Erro de ligação. Verifique a internet e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PaymentProcessingOverlay active={loading} />

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Secção: Dados */}
        <section>
          <h2 className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-5">
            1. Dados do comprador
          </h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="buyerName" className="text-zinc-400 font-medium text-sm ml-1">
                Nome completo *
              </Label>
              <Input
                id="buyerName"
                data-testid="input-buyer-name"
                required
                value={formData.buyerName}
                onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })}
                className="public-input"
                placeholder="João Silva"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="buyerEmail" className="text-zinc-400 font-medium text-sm ml-1">
                  Email *
                </Label>
                <Input
                  id="buyerEmail"
                  data-testid="input-buyer-email"
                  type="email"
                  required
                  value={formData.buyerEmail}
                  onChange={(e) => setFormData({ ...formData, buyerEmail: e.target.value })}
                  className="public-input"
                  placeholder="joao@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="buyerPhone" className="text-zinc-400 font-medium text-sm ml-1">
                  Telefone
                </Label>
                <Input
                  id="buyerPhone"
                  type="tel"
                  value={formData.buyerPhone}
                  onChange={(e) => setFormData({ ...formData, buyerPhone: e.target.value })}
                  className="public-input"
                  placeholder="+351 912 345 678"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Secção: Cupão */}
        <section>
          <Label className="text-zinc-400 font-medium text-sm ml-1 flex items-center gap-1.5 mb-3">
            <Tag className="h-3.5 w-3.5" />
            Código de desconto
          </Label>

          {appliedCoupon ? (
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-emerald-600 font-bold text-sm font-mono">{appliedCoupon.code}</p>
                <p className="text-emerald-600/70 text-xs">
                  −{formatEuro(appliedCoupon.discountCents)} aplicado
                </p>
              </div>
              <button type="button" onClick={handleRemoveCoupon} className="text-zinc-500 hover:text-zinc-400">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                value={couponCode}
                onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleApplyCoupon(); } }}
                className="public-input font-mono uppercase placeholder:normal-case"
                placeholder="CÓDIGO20"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleApplyCoupon}
                disabled={!couponCode.trim() || couponLoading}
                className="h-11 px-5 rounded-xl border border-white/15 bg-white/5 text-white hover:bg-white/10 shrink-0"
              >
                {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aplicar'}
              </Button>
            </div>
          )}
          {couponError && (
            <p className="text-red-600 text-xs mt-2 ml-1 flex items-center gap-1">
              <XCircle className="h-3.5 w-3.5" />
              {couponError}
            </p>
          )}
        </section>

        {/* Secção: Pagamento */}
        <section>
          <h2 className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-5">
            2. Método de pagamento
          </h2>
          <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />

          <div className="mt-5 rounded-2xl border border-white/10 bg-[#0c0c12] p-5">
            {paymentMethod === 'card' && useStripeCard && (
              <OrderStripeCheckout
                orderId={orderId}
                buyerName={formData.buyerName}
                buyerEmail={formData.buyerEmail}
                buyerPhone={formData.buyerPhone || formData.mbwayPhone}
                couponId={appliedCoupon?.id}
                discountCents={couponDiscount}
                acceptedTerms={acceptedTerms}
                onError={setSubmitError}
                onSuccess={() => router.push(`/orders/${orderId}/success`)}
              />
            )}

            {paymentMethod === 'card' && !useStripeCard && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-zinc-400 text-xs ml-1">Número do cartão</Label>
                  <Input
                    inputMode="numeric"
                    autoComplete="cc-number"
                    placeholder="1234 5678 9012 3456"
                    value={formData.cardNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, cardNumber: formatCardNumber(e.target.value) })
                    }
                    className="public-input font-mono tracking-wider"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-400 text-xs ml-1">Validade</Label>
                    <Input
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      placeholder="MM/AA"
                      maxLength={5}
                      value={formData.cardExpiry}
                      onChange={(e) => {
                        let v = e.target.value.replace(/\D/g, '').slice(0, 4);
                        if (v.length >= 3) v = `${v.slice(0, 2)}/${v.slice(2)}`;
                        setFormData({ ...formData, cardExpiry: v });
                      }}
                      className="public-input font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400 text-xs ml-1">CVC</Label>
                    <Input
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      placeholder="123"
                      maxLength={4}
                      value={formData.cardCvc}
                      onChange={(e) =>
                        setFormData({ ...formData, cardCvc: e.target.value.replace(/\D/g, '').slice(0, 4) })
                      }
                      className="public-input font-mono"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  {['VISA', 'MC', 'AMEX'].map((brand) => (
                    <span
                      key={brand}
                      className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold text-zinc-500 tracking-wider"
                    >
                      {brand}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {paymentMethod === 'mbway' && (
              <div className="space-y-3">
                <p className="text-sm text-zinc-400">
                  {stripePaymentsEnabled && !mockPaymentsEnabled
                    ? 'MB Way estará disponível em breve. Utilize cartão por agora.'
                    : 'Receberá uma notificação no telemóvel para autorizar o pagamento.'}
                </p>
                <div className="space-y-2">
                  <Label className="text-zinc-400 text-xs ml-1">Número MB WAY *</Label>
                  <Input
                    type="tel"
                    placeholder="912 345 678"
                    value={formData.mbwayPhone}
                    onChange={(e) => setFormData({ ...formData, mbwayPhone: e.target.value })}
                    className="public-input"
                  />
                </div>
              </div>
            )}

            {paymentMethod === 'multibanco' && (
              <div className="space-y-4">
                <p className="text-sm text-zinc-400">
                  Utilize os dados abaixo no multibanco ou homebanking. O pagamento será confirmado automaticamente.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Entidade</p>
                    <p className="text-2xl font-mono font-bold text-white">{multibancoRef.entity}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Referência</p>
                    <p className="text-2xl font-mono font-bold text-white">{multibancoRef.reference}</p>
                  </div>
                </div>
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
                  <p className="text-sm text-emerald-300">
                    Montante: <strong className="text-white">{formatEuro(effectiveTotal)}</strong>
                  </p>
                </div>
              </div>
            )}

            {paymentMethod === 'paypal' && (
              <div className="text-center py-4">
                <p className="text-sm text-zinc-400 mb-4">
                  Será redirecionado para o PayPal para concluir o pagamento em segurança.
                </p>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#0070ba]/20 border border-[#0070ba]/40 px-5 py-2.5">
                  <svg className="h-5 w-5 text-[#009cde]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .762-.647h6.64c2.17 0 3.732.448 4.648 1.332.79.74 1.085 1.795.877 3.137-.212 1.38-.78 2.526-1.69 3.404-.96.925-2.305 1.384-4 1.384h-1.9l-.72 4.563a.641.641 0 0 1-.633.548z" />
                  </svg>
                  <span className="text-[#009cde] font-bold text-sm">PayPal</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Total + Termos */}
        <section className="rounded-2xl border border-white/10 bg-[#0c0c12] p-5 space-y-4 lg:hidden">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Bilhete(s)</span>
            <span className="text-white">{formatEuro(subtotalCents)}</span>
          </div>
          {feePaidBy === "BUYER" && serviceFeeCents > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Taxa de Serviço LivePass</span>
              <span className="text-white">{formatEuro(serviceFeeCents)}</span>
            </div>
          )}
          {appliedCoupon && (
            <div className="flex justify-between text-sm">
              <span className="text-emerald-600">Desconto</span>
              <span className="text-emerald-600 font-semibold">−{formatEuro(appliedCoupon.discountCents)}</span>
            </div>
          )}
          <div className="flex justify-between items-end border-t border-white/10 pt-4">
            <span className="text-white font-semibold">Total</span>
            <div className="text-right">
              <span className="text-3xl font-black text-[#5ec8f8] tracking-tight">{formatEuro(effectiveTotal)}</span>
              <p className="text-[11px] text-zinc-500 mt-0.5">IVA incluído onde aplicável</p>
            </div>
          </div>
        </section>

        <div className="flex items-start gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
          <Checkbox
            id="terms"
            data-testid="checkbox-terms"
            checked={acceptedTerms}
            onCheckedChange={(checked: boolean) => setAcceptedTerms(checked)}
            className="mt-0.5"
          />
          <Label htmlFor="terms" className="text-sm text-zinc-400 leading-relaxed font-normal cursor-pointer">
            Li e aceito os{' '}
            <Link href="/terms" target="_blank" className="text-white underline underline-offset-2 hover:text-zinc-200">
              Termos e Condições
            </Link>{' '}
            e a{' '}
            <Link href="/privacy" target="_blank" className="text-white underline underline-offset-2 hover:text-zinc-200">
              Política de Privacidade
            </Link>
            .
          </Label>
        </div>

        {submitError && (
          <div
            data-testid="checkout-payment-error"
            className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            {submitError}
          </div>
        )}

        <div className="flex items-center justify-center gap-6 py-2 text-[11px] text-zinc-500 uppercase tracking-widest">
          <span className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5" />
            SSL 256-bit
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            Pagamento seguro
          </span>
        </div>

        {!useStripeCard && (
        <Button
          type="submit"
          data-testid="btn-confirm-payment"
          disabled={loading || !acceptedTerms || (!canMockPay && !useStripeCard)}
          className="w-full h-14 rounded-2xl bg-[#00a0e3] text-white font-bold text-[15px] hover:bg-[#0090cc] shadow-lg shadow-[#00a0e3]/25 transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:hover:translate-y-0"
          size="lg"
          aria-busy={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              A processar...
            </span>
          ) : paymentMethod === 'paypal' ? (
            `Pagar com PayPal — ${formatEuro(effectiveTotal)}`
          ) : paymentMethod === 'mbway' ? (
            `Pagar com MB WAY — ${formatEuro(effectiveTotal)}`
          ) : paymentMethod === 'multibanco' ? (
            `Confirmar pagamento — ${formatEuro(effectiveTotal)}`
          ) : (
            `Pagar ${formatEuro(effectiveTotal)}`
          )}
        </Button>
        )}

        <p className="text-center text-[11px] text-zinc-500 leading-relaxed">
          Os seus dados de pagamento são encriptados e nunca são armazenados nos nossos servidores.
        </p>
      </form>
    </>
  );
}
