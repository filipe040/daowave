/**
 * Check-in Scanner Page
 */

'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function CheckinPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleVerify = async () => {
    if (!qrCode.trim()) {
      setResult({ success: false, message: 'Por favor, insira o código QR' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/promotor/checkin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrCode,
          eventId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setResult({ success: false, message: data.error || 'Erro ao verificar bilhete' });
        return;
      }

      setResult({ success: true, message: data.message || 'Bilhete verificado com sucesso!' });
      setQrCode(''); // Clear input
    } catch (error) {
      console.error('Check-in error:', error);
      setResult({ success: false, message: 'Erro ao verificar bilhete' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">
          Check-in de Bilhetes
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Código QR do Bilhete
            </label>
            <textarea
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
              placeholder="Cole ou digite o código QR aqui..."
              rows={4}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-mono"
            />
          </div>

          <Button
            onClick={handleVerify}
            disabled={loading || !qrCode.trim()}
            className="w-full"
            size="lg"
          >
            {loading ? 'A verificar...' : 'Verificar Bilhete'}
          </Button>

          {result && (
            <div
              className={`mt-6 p-4 rounded-lg ${
                result.success
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              <p className="font-semibold">{result.message}</p>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> Cole o código QR completo (base64) do bilhete para verificar.
              O sistema validará a assinatura HMAC e verificar se o bilhete já foi usado.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
