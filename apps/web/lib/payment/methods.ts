import { config } from "@/lib/config";
import { isMockPaymentsEnabled, isStripePaymentsEnabled } from "@/lib/payment";

export type PaymentMethodId = "card" | "mbway" | "multibanco" | "paypal";

export interface PaymentMethodsInfo {
  available: PaymentMethodId[];
  stripeEnabled: boolean;
  mockEnabled: boolean;
}

/** Métodos de pagamento realmente disponíveis no checkout (server-side). */
export function getPaymentMethodsInfo(): PaymentMethodsInfo {
  const stripeEnabled = isStripePaymentsEnabled();
  const mockEnabled = isMockPaymentsEnabled();
  const available: PaymentMethodId[] = [];

  if (stripeEnabled || mockEnabled) {
    available.push("card");
  }
  if (config.payments.mbway.enabled) {
    available.push("mbway");
  }
  if (config.payments.multibanco.enabled) {
    available.push("multibanco");
  }
  if (config.payments.paypal.enabled) {
    available.push("paypal");
  }

  if (available.length === 0) {
    available.push("card");
  }

  return { available, stripeEnabled, mockEnabled };
}

/** Labels para footer/marketing — só métodos ativos. */
export function getPublicPaymentLabels(): string[] {
  const { available } = getPaymentMethodsInfo();
  const labels: string[] = [];
  if (available.includes("card")) {
    labels.push("Cartão");
    if (isStripePaymentsEnabled()) labels.push("Apple Pay");
  }
  if (available.includes("mbway")) labels.push("MB Way");
  if (available.includes("multibanco")) labels.push("Multibanco");
  if (available.includes("paypal")) labels.push("PayPal");
  return labels.length > 0 ? labels : ["Cartão"];
}
