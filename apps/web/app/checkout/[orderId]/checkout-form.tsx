'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!formData.buyerName.trim() || !formData.buyerEmail.trim()) {
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Dados do Comprador</h2>

      <div>
        <Label htmlFor="buyerName">Nome Completo *</Label>
        <Input
          id="buyerName"
          data-testid="input-buyer-name"
          required
          value={formData.buyerName}
          onChange={(e) =>
            setFormData({ ...formData, buyerName: e.target.value })
          }
        />
      </div>

      <div>
        <Label htmlFor="buyerEmail">Email *</Label>
        <Input
          id="buyerEmail"
          data-testid="input-buyer-email"
          type="email"
          required
          value={formData.buyerEmail}
          onChange={(e) =>
            setFormData({ ...formData, buyerEmail: e.target.value })
          }
        />
      </div>

      <div>
        <Label htmlFor="buyerPhone">Telefone</Label>
        <Input
          id="buyerPhone"
          type="tel"
          value={formData.buyerPhone}
          onChange={(e) =>
            setFormData({ ...formData, buyerPhone: e.target.value })
          }
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-800">
          <strong>Modo de Teste:</strong> Este é um pagamento simulado.
          Clique em &quot;Confirmar Pagamento&quot; para completar a compra.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          By clicking &quot;Pay now&quot;, you agree to our &quot;Terms of Service&quot;.
        </p>
      </div>

      <Button type="submit" disabled={loading} className="w-full" size="lg" aria-busy={loading}>
        {loading ? 'A processar...' : 'Confirmar Pagamento'}
      </Button>
    </form>
  );
}
