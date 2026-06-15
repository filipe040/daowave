import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import type { IPaymentProvider, PaymentIntent, PaymentResult } from "./provider";

function requireStripe(): Stripe {
  if (!stripe) throw new Error("Stripe não configurado");
  return stripe as Stripe;
}

export class StripePaymentProvider implements IPaymentProvider {
  async createIntent(params: {
    amount: number;
    currency: string;
    orderId: string;
    metadata?: Record<string, string>;
  }): Promise<PaymentIntent> {
    const s = requireStripe();
    const pi = await s.paymentIntents.create({
      amount: params.amount,
      currency: params.currency.toLowerCase(),
      metadata: {
        orderId: params.orderId,
        ...params.metadata,
      },
      automatic_payment_methods: { enabled: true },
    });

    return {
      id: pi.id,
      amount: pi.amount,
      currency: pi.currency,
      status: pi.status === "succeeded" ? "succeeded" : pi.status === "canceled" ? "failed" : "pending",
      clientSecret: pi.client_secret ?? undefined,
      metadata: pi.metadata as Record<string, string>,
    };
  }

  async confirmPayment(paymentRef: string): Promise<PaymentResult> {
    try {
      const s = requireStripe();
      const pi = await s.paymentIntents.retrieve(paymentRef);
      if (pi.status === "succeeded") {
        return { success: true, paymentRef: pi.id };
      }
      if (pi.status === "processing") {
        return { success: false, paymentRef: pi.id, error: "Pagamento em processamento" };
      }
      return {
        success: false,
        paymentRef: pi.id,
        error: pi.last_payment_error?.message ?? "Pagamento não concluído",
      };
    } catch {
      return { success: false, paymentRef, error: "Stripe não configurado" };
    }
  }

  async getStatus(paymentRef: string): Promise<PaymentIntent | null> {
    try {
      const s = requireStripe();
      const pi = await s.paymentIntents.retrieve(paymentRef);
      return {
        id: pi.id,
        amount: pi.amount,
        currency: pi.currency,
        status: pi.status === "succeeded" ? "succeeded" : pi.status === "canceled" ? "failed" : "pending",
        clientSecret: pi.client_secret ?? undefined,
        metadata: pi.metadata as Record<string, string>,
      };
    } catch {
      return null;
    }
  }

  async refundPayment(paymentRef: string, amountCents?: number) {
    const s = requireStripe();
    return s.refunds.create({
      payment_intent: paymentRef,
      ...(amountCents != null ? { amount: amountCents } : {}),
    });
  }
}

export const stripePaymentProvider = new StripePaymentProvider();
