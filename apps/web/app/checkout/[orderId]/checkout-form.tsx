'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { Tag, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface CheckoutFormProps {
  orderId: string;
  totalCents: number;
  eventId: string;
}

interface AppliedCoupon {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  discountCents: number;
  finalCents: number;
}

export function CheckoutForm({ orderId, totalCents, eventId }: CheckoutFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    buyerName: '',
    buyerEmail: '',
    buyerPhone: '',
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  const effectiveTotal = appliedCoupon ? appliedCoupon.finalCents : totalCents;

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
          totalCents,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!formData.buyerName.trim() || !formData.buyerEmail.trim()) return;
    if (!acceptedTerms) {
      alert('Por favor, aceite os Termos e Condições e a Política de Privacidade.');
      return;
    }
    setLoading(true);

    try {
      const response = await fetch(`/api/checkout/${orderId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerName: formData.buyerName.trim(),
          buyerEmail: formData.buyerEmail.trim(),
          buyerPhone: formData.buyerPhone.trim() || undefined,
          paymentMock: true,
          couponId: appliedCoupon?.id,
          discountCents: appliedCoupon?.discountCents ?? 0,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Erro ao processar pagamento');
        return;
      }

      router.push(`/my-tickets?order=${orderId}`);
    } catch (error) {
      console.error('Payment error:', error);
      alert('Erro ao processar pagamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-[12px] font-bold text-white/50 uppercase tracking-[0.2em] mb-8">Dados do Comprador</h2>

      <div className="space-y-2">
        <Label htmlFor="buyerName" className="text-white/70 font-semibold text-sm ml-1">Nome Completo *</Label>
        <Input
          id="buyerName"
          data-testid="input-buyer-name"
          required
          value={formData.buyerName}
          onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })}
          className="h-14 bg-white/5 border-white/10 text-white rounded-2xl px-5 focus-visible:ring-1 focus-visible:ring-white/20 placeholder:text-white/30"
          placeholder="Ex: João Silva"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="buyerEmail" className="text-white/70 font-semibold text-sm ml-1">Email *</Label>
        <Input
          id="buyerEmail"
          data-testid="input-buyer-email"
          type="email"
          required
          value={formData.buyerEmail}
          onChange={(e) => setFormData({ ...formData, buyerEmail: e.target.value })}
          className="h-14 bg-white/5 border-white/10 text-white rounded-2xl px-5 focus-visible:ring-1 focus-visible:ring-white/20 placeholder:text-white/30"
          placeholder="joao.silva@email.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="buyerPhone" className="text-white/70 font-semibold text-sm ml-1">Telefone</Label>
        <Input
          id="buyerPhone"
          type="tel"
          value={formData.buyerPhone}
          onChange={(e) => setFormData({ ...formData, buyerPhone: e.target.value })}
          className="h-14 bg-white/5 border-white/10 text-white rounded-2xl px-5 focus-visible:ring-1 focus-visible:ring-white/20 placeholder:text-white/30"
          placeholder="+351 900 000 000"
        />
      </div>

      {/* Coupon Section */}
      <div className="space-y-2">
        <Label className="text-white/70 font-semibold text-sm ml-1 flex items-center gap-1.5">
          <Tag className="h-3.5 w-3.5" />
          Código de Desconto
        </Label>

        {appliedCoupon ? (
          <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-5 py-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-emerald-400 font-bold text-sm font-mono">{appliedCoupon.code}</p>
              <p className="text-emerald-400/70 text-xs">
                {appliedCoupon.discountType === 'PERCENTAGE'
                  ? `${appliedCoupon.discountValue}% de desconto`
                  : `${(appliedCoupon.discountCents / 100).toFixed(2)}€ de desconto`}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRemoveCoupon}
              className="text-white/40 hover:text-white/70 transition-colors"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              value={couponCode}
              onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleApplyCoupon(); } }}
              className="h-12 bg-white/5 border-white/10 text-white rounded-2xl px-5 font-mono uppercase focus-visible:ring-1 focus-visible:ring-white/20 placeholder:text-white/30 placeholder:normal-case"
              placeholder="CÓDIGO20"
            />
            <Button
              type="button"
              onClick={handleApplyCoupon}
              disabled={!couponCode.trim() || couponLoading}
              className="h-12 px-5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border-0 shrink-0"
            >
              {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aplicar'}
            </Button>
          </div>
        )}
        {couponError && (
          <p className="text-red-400 text-xs ml-1 flex items-center gap-1">
            <XCircle className="h-3.5 w-3.5" />
            {couponError}
          </p>
        )}
      </div>

      {/* Order Summary */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white/90 mb-4">Resumo da Encomenda</h3>
        <div className="flex justify-between mb-2">
          <span className="text-white/70 text-sm">Subtotal:</span>
          <span className="text-white text-sm">{(totalCents / 100).toFixed(2).replace('.', ',')}€</span>
        </div>
        {appliedCoupon && (
          <div className="flex justify-between mb-2">
            <span className="text-emerald-400 text-sm flex items-center gap-1">
              <Tag className="h-3.5 w-3.5" />
              Desconto ({appliedCoupon.code}):
            </span>
            <span className="text-emerald-400 text-sm font-bold">
              -{(appliedCoupon.discountCents / 100).toFixed(2).replace('.', ',')}€
            </span>
          </div>
        )}
        <div className="flex justify-between font-bold border-t border-white/10 pt-4">
          <span className="text-white">Total a Pagar:</span>
          <span className="text-emerald-400">
            {(effectiveTotal / 100).toFixed(2).replace('.', ',')}€{' '}
            <span className="text-xs font-normal text-white/50">(IVA incluído)</span>
          </span>
        </div>
      </div>

      <div className="flex items-start space-x-3 mb-8 bg-white/5 p-4 rounded-xl border border-white/10">
        <Checkbox
          id="terms"
          checked={acceptedTerms}
          onCheckedChange={(checked: boolean) => setAcceptedTerms(checked)}
          className="mt-1"
        />
        <Label htmlFor="terms" className="text-sm text-white/70 leading-relaxed font-normal cursor-pointer">
          Li e aceito os <Link href="/terms" target="_blank" className="text-emerald-400 hover:underline">Termos e Condições</Link> e a <Link href="/privacy" target="_blank" className="text-emerald-400 hover:underline">Política de Privacidade</Link>.
        </Label>
      </div>

      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 mb-8">
        <p className="text-[14px] text-emerald-400 font-medium">
          <strong className="font-bold text-emerald-300">Pagamento Seguro:</strong> Encomenda com obrigação de pagamento.
        </p>
      </div>

      <Button
        type="submit"
        disabled={loading || !acceptedTerms}
        className="w-full h-14 rounded-2xl bg-white text-black font-bold text-[15px] hover:bg-white/90 shadow-[0_12px_40px_rgba(255,255,255,0.15)] transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0"
        size="lg"
        aria-busy={loading}
      >
        {loading ? 'A processar de forma segura...' : `Confirmar e Pagar — ${(effectiveTotal / 100).toFixed(2).replace('.', ',')}€`}
      </Button>
    </form>
  );
}
