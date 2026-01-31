"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { AlertTriangle } from "lucide-react";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

function CheckoutForm({ clientSecret }: { clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/orders/${orderId}/success`,
      },
    });

    if (error) {
      console.error(error);
      setError(error.message || "Erro ao processar pagamento");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
        <PaymentElement />
      </div>
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-blue-500/50 transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 active:scale-95"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            A processar pagamento...
          </span>
        ) : (
          "Confirmar pagamento"
        )}
      </button>
    </form>
  );
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  let clientSecret = searchParams.get("payment_intent");
  
  // Fallback to sessionStorage if not in URL
  if (!clientSecret && typeof window !== "undefined") {
    clientSecret = sessionStorage.getItem("payment_intent");
  }

  if (!clientSecret) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-0">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
          <div className="mb-4 flex justify-center">
          <AlertTriangle className="h-14 w-14 text-amber-400" strokeWidth={1.5} />
        </div>
          <p className="text-lg font-semibold text-zinc-300 mb-2">Sessão de pagamento inválida</p>
          <p className="text-sm text-zinc-500 mb-6">A sua sessão expirou ou é inválida.</p>
          <a
            href="/events"
            className="inline-block rounded-xl bg-white px-6 py-3 text-sm font-semibold text-zinc-950 transition-all hover:scale-105 hover:shadow-lg hover:shadow-white/20"
          >
            Voltar aos eventos
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-0 animate-fade-in">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold">Checkout</h1>
        <p className="text-base text-zinc-400">Complete o seu pagamento de forma segura</p>
      </div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8 backdrop-blur-sm shadow-2xl shadow-black/50">
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: "night",
              variables: {
                colorPrimary: "#3b82f6",
                colorBackground: "#18181b",
                colorText: "#fafafa",
                colorDanger: "#ef4444",
                fontFamily: "system-ui, sans-serif",
                spacingUnit: "4px",
                borderRadius: "8px",
              },
            },
          }}
        >
          <CheckoutForm clientSecret={clientSecret} />
        </Elements>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-2xl px-4 sm:px-0 animate-fade-in">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold">Checkout</h1>
          <p className="text-base text-zinc-400">A carregar...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
