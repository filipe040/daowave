"use client";

import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Loader2 } from "lucide-react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

function StripePayButton({
  orderId,
  buyerName,
  buyerEmail,
  buyerPhone,
  couponId,
  discountCents,
  acceptedTerms,
  onError,
  onSuccess,
}: {
  orderId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  couponId?: string;
  discountCents: number;
  acceptedTerms: boolean;
  onError: (msg: string) => void;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    if (!buyerName.trim() || !buyerEmail.trim()) {
      onError("Preencha o nome e email.");
      return;
    }
    if (!acceptedTerms) {
      onError("Aceite os Termos e Condições para continuar.");
      return;
    }

    setLoading(true);
    onError("");

    try {
      const piRes = await fetch(`/api/checkout/${orderId}/payment-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponId, discountCents }),
      });
      const piData = await piRes.json();
      if (!piRes.ok) {
        onError(piData.error || "Erro ao preparar pagamento.");
        return;
      }

      const { error: submitError } = await elements.submit();
      if (submitError) {
        onError(submitError.message || "Dados de pagamento inválidos.");
        return;
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret: piData.clientSecret,
        confirmParams: {
          payment_method_data: {
            billing_details: {
              name: buyerName.trim(),
              email: buyerEmail.trim(),
              phone: buyerPhone || undefined,
            },
          },
        },
        redirect: "if_required",
      });

      if (error) {
        onError(error.message || "Pagamento recusado.");
        return;
      }

      const paymentIntentId = paymentIntent?.id ?? piData.paymentIntentId;
      const confirmRes = await fetch(`/api/checkout/${orderId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerName: buyerName.trim(),
          buyerEmail: buyerEmail.trim(),
          buyerPhone: buyerPhone?.trim() || undefined,
          paymentIntentId,
          couponId,
          discountCents,
          paymentMethodCode: "VISA",
        }),
      });

      if (!confirmRes.ok) {
        const err = await confirmRes.json();
        onError(err.error || "Erro ao confirmar encomenda.");
        return;
      }

      onSuccess();
    } catch {
      onError("Erro de ligação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-white/10 bg-[#0c0c12] p-4">
        <PaymentElement options={{ layout: "tabs" }} />
      </div>
      <button
        type="button"
        onClick={handlePay}
        disabled={!stripe || loading || !acceptedTerms}
        className="w-full h-14 rounded-2xl bg-[#00a0e3] text-white font-bold text-[15px] hover:bg-[#0090cc] shadow-lg shadow-[#00a0e3]/25 transition-all disabled:opacity-50 mt-4"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            A processar…
          </span>
        ) : (
          "Pagar com segurança"
        )}
      </button>
    </>
  );
}

export function OrderStripeCheckout({
  orderId,
  buyerName,
  buyerEmail,
  buyerPhone,
  couponId,
  discountCents,
  acceptedTerms,
  onError,
  onSuccess,
}: {
  orderId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  couponId?: string;
  discountCents: number;
  acceptedTerms: boolean;
  onError: (msg: string) => void;
  onSuccess: () => void;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/checkout/${orderId}/payment-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponId, discountCents }),
      });
      const data = await res.json();
      if (!cancelled && res.ok && data.clientSecret) {
        setClientSecret(data.clientSecret);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId, couponId, discountCents]);

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center py-10 text-zinc-400 gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-[#00a0e3]" />
        A preparar pagamento seguro…
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "night",
          variables: {
            colorPrimary: "#00a0e3",
            colorBackground: "#0c0c12",
            colorText: "#fafafa",
            borderRadius: "12px",
          },
        },
      }}
    >
      <StripePayButton
        orderId={orderId}
        buyerName={buyerName}
        buyerEmail={buyerEmail}
        buyerPhone={buyerPhone}
        couponId={couponId}
        discountCents={discountCents}
        acceptedTerms={acceptedTerms}
        onError={onError}
        onSuccess={onSuccess}
      />
    </Elements>
  );
}
