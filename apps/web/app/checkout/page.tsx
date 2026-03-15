"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { AlertTriangle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
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
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    if (!acceptedTerms) {
      setError("Por favor, aceite os Termos e Condições e a Política de Privacidade.");
      setLoading(false);
      return;
    }

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
        <div className="rounded-2xl border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}
      <div className="rounded-3xl border border-white/10 bg-black/40 p-4 sm:p-5 overflow-hidden">
        <PaymentElement />
      </div>
      <div className="flex items-start space-x-3 mt-4 bg-black/40 p-4 rounded-xl border border-white/10">
        <Checkbox
          id="terms"
          checked={acceptedTerms}
          onCheckedChange={(checked: boolean) => setAcceptedTerms(checked)}
          className="mt-1 border-white/50"
        />
        <label htmlFor="terms" className="text-sm text-white/70 leading-relaxed font-normal cursor-pointer">
          Li e aceito os <Link href="/terms" target="_blank" className="text-emerald-400 hover:underline">Termos e Condições</Link> e a <Link href="/privacy" target="_blank" className="text-emerald-400 hover:underline">Política de Privacidade</Link>.
        </label>
      </div>
      <button
        type="submit"
        disabled={!stripe || loading || !acceptedTerms}
        className="w-full rounded-full bg-white px-6 py-4 sm:py-4 mt-2 text-[15px] font-bold text-black shadow-lg shadow-white/10 transition-all hover:bg-white/90 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 active:scale-[0.98]"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
            A processar…
          </span>
        ) : (
          "Confirmar e Pagar"
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
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-12 text-center shadow-[0_18px_60px_rgba(0,0,0,.45)]">
          <div className="mb-4 flex justify-center">
            <AlertTriangle className="h-14 w-14 text-amber-400" strokeWidth={1.5} />
          </div>
          <p className="text-xl font-semibold text-white/92 mb-2">Sessão de pagamento inválida</p>
          <p className="text-[15px] text-white/55 mb-8">A sua sessão expirou ou é inválida.</p>
          <a
            href="/events"
            className="inline-block rounded-full bg-white px-6 py-3.5 text-[14px] font-bold text-black transition-all hover:scale-[1.03] active:scale-[0.98] shadow-[0_8px_32px_rgba(255,255,255,.18)]"
          >
            Voltar aos eventos
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-0 animate-fade-in mt-12 mb-24">
      <div className="mb-8 space-y-2 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-white/92">Checkout</h1>
        <p className="text-base text-white/55">Complete o seu pagamento de forma segura</p>
      </div>
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-2xl shadow-[0_18px_60px_rgba(0,0,0,.45)]">
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: "night",
              variables: {
                colorPrimary: "#ffffff",
                colorBackground: "#09090b",
                colorText: "#ffffff",
                colorDanger: "#ef4444",
                fontFamily: "system-ui, sans-serif",
                spacingUnit: "4px",
                borderRadius: "16px",
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
      <div className="mx-auto max-w-2xl px-4 sm:px-0 animate-fade-in mt-12 text-center">
        <h1 className="text-3xl font-bold text-white/92">Checkout</h1>
        <p className="mt-2 text-sm text-white/55">A carregar interface segura...</p>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
