"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function MockCheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");
  const [processing, setProcessing] = useState(false);

  const handleMockPayment = async () => {
    if (!orderId) return;

    setProcessing(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Call mock payment completion endpoint
      const res = await fetch(`/api/payments/mock/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      if (res.ok) {
        router.push(`/orders/${orderId}/success?mock=true`);
      } else {
        console.error("Failed to complete mock payment");
        setProcessing(false);
      }
    } catch (error) {
      console.error("Mock payment error:", error);
      setProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-0 animate-fade-in">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold">Checkout (Modo Desenvolvimento)</h1>
        <p className="text-base text-zinc-400">Pagamento simulado para testes</p>
      </div>
      <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-6 sm:p-8 backdrop-blur-sm">
        <div className="mb-6">
          <div className="mb-4 text-5xl">🔧</div>
          <h2 className="text-xl font-bold mb-2 text-yellow-400">Modo Mock Ativo</h2>
          <p className="text-sm text-zinc-300 mb-4">
            Está a usar um pagamento simulado porque o Stripe não está configurado ou a chave é inválida.
          </p>
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 mb-6">
            <p className="text-sm text-yellow-300">
              <strong>Nota:</strong> Para usar pagamentos reais, configure uma chave válida do Stripe no ficheiro .env
            </p>
          </div>
        </div>
        
        <button
          onClick={handleMockPayment}
          disabled={processing}
          className="w-full rounded-xl bg-gradient-to-r from-yellow-600 to-orange-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-yellow-500/50 transition-all hover:scale-105 hover:shadow-xl hover:shadow-yellow-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 active:scale-95"
        >
          {processing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              A simular pagamento...
            </span>
          ) : (
            "Simular Pagamento Bem-Sucedido"
          )}
        </button>
      </div>
    </div>
  );
}

export default function MockCheckoutPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-2xl px-4 sm:px-0 animate-fade-in">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold">Checkout (Modo Desenvolvimento)</h1>
          <p className="text-base text-zinc-400">A carregar...</p>
        </div>
      </div>
    }>
      <MockCheckoutContent />
    </Suspense>
  );
}
