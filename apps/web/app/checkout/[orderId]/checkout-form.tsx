'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';

interface CheckoutFormProps {
  orderId: string;
  totalCents: number;
}

export function CheckoutForm({ orderId, totalCents }: CheckoutFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    buyerName: '',
    buyerEmail: '',
    buyerPhone: '',
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const serviceFee = totalCents > 150 ? 1.50 : 0;
  const ticketPrice = (totalCents / 100) - serviceFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!formData.buyerName.trim() || !formData.buyerEmail.trim()) {
      return;
    }
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

      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-8">
        <h3 className="text-sm font-semibold text-white/90 mb-4">Resumo da Encomenda</h3>
        <div className="flex justify-between mb-2">
          <span className="text-white/70 text-sm">Preço do Bilhete:</span>
          <span className="text-white text-sm">{ticketPrice.toFixed(2).replace('.', ',')}€</span>
        </div>
        <div className="flex justify-between mb-4">
          <span className="text-white/70 text-sm">Taxa de Serviço:</span>
          <span className="text-white text-sm">{serviceFee.toFixed(2).replace('.', ',')}€</span>
        </div>
        <div className="flex justify-between font-bold border-t border-white/10 pt-4">
          <span className="text-white">Total a Pagar:</span>
          <span className="text-emerald-400">{(totalCents / 100).toFixed(2).replace('.', ',')}€ <span className="text-xs font-normal text-white/50">(IVA incluído)</span></span>
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
        {loading ? 'A processar de forma segura...' : 'Confirmar e Pagar'}
      </Button>
    </form>
  );
}
