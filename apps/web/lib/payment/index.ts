import { mockPaymentProvider } from "./mock";
import { stripePaymentProvider } from "./stripe-provider";
import type { IPaymentProvider } from "./provider";
import { config } from "@/lib/config";

export function getPaymentProvider(): IPaymentProvider {
  if (config.payments.stripe.enabled && config.features.realPayments) {
    return stripePaymentProvider;
  }
  return mockPaymentProvider;
}

export function isStripePaymentsEnabled(): boolean {
  return config.payments.stripe.enabled && config.features.realPayments;
}

export function isMockPaymentsEnabled(): boolean {
  return config.features.mockPayments && !isStripePaymentsEnabled();
}

export { getPaymentMethodsInfo, getPublicPaymentLabels } from "./methods";
export type { PaymentMethodId } from "./methods";

export { stripePaymentProvider };
