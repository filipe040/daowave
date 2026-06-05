"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, ShieldCheck, CreditCard } from "lucide-react";
import { PaymentProcessingOverlay } from "@/components/checkout/PaymentProcessingOverlay";
import { CheckoutStepper } from "@/components/checkout/CheckoutStepper";

function MockCheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const handlePayment = async () => {
    if (!orderId) return;

    setProcessing(true);
    setError("");

    try {
      await new Promise((r) => setTimeout(r, 2000));

      const res = await fetch(`/api/payments/mock/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      if (res.ok) {
        router.push(`/orders/${orderId}/success`);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Não foi possível concluir o pagamento.");
        setProcessing(false);
      }
    } catch {
      setError("Erro de ligação. Tente novamente.");
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black pt-24 pb-16 relative overflow-hidden">
      <PaymentProcessingOverlay active={processing} />

      <div className="absolute top-0 right-0 -mr-32 -mt-32 w-[500px] h-[500px] bg-emerald-500/8 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 max-w-lg relative z-10">
        <CheckoutStepper currentStep={2} />

        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-white tracking-tight">Pagamento seguro</h1>
          <p className="text-white/45 mt-2 text-sm">Confirme para concluir a encomenda</p>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] backdrop-blur-3xl p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-center gap-3 py-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10">
              <CreditCard className="h-7 w-7 text-white/70" />
            </div>
          </div>

          <p className="text-center text-white/60 text-sm leading-relaxed">
            O seu pagamento será processado de forma segura. Após confirmação, os bilhetes serão
            emitidos e enviados por email.
          </p>

          {error && (
            <p className="text-center text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <button
            onClick={handlePayment}
            disabled={processing || !orderId}
            data-testid="btn-confirm-payment"
            className="w-full rounded-2xl bg-white px-6 py-4 text-[15px] font-bold text-black shadow-[0_12px_40px_rgba(255,255,255,0.12)] transition-all hover:bg-white/90 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {processing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                A processar...
              </span>
            ) : (
              "Confirmar e pagar"
            )}
          </button>

          <p className="flex items-center justify-center gap-2 text-[11px] text-white/30 uppercase tracking-widest">
            <ShieldCheck className="h-3.5 w-3.5" />
            SSL · Pagamento encriptado
          </p>
        </div>
      </div>
    </div>
  );
}

export default function MockCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-white/20" />
        </div>
      }
    >
      <MockCheckoutContent />
    </Suspense>
  );
}
