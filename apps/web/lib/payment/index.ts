/**
 * Payment Provider Factory
 * Returns the configured payment provider
 */

import { mockPaymentProvider } from './mock';
import type { IPaymentProvider } from './provider';

// TODO: Add Stripe and PSP PT implementations
// import { StripePaymentProvider } from './stripe';
// import { PSPPaymentProvider } from './psp';

export function getPaymentProvider(): IPaymentProvider {
  const provider = process.env.PAYMENT_PROVIDER || 'mock';
  
  switch (provider) {
    case 'mock':
      return mockPaymentProvider;
    // case 'stripe':
    //   return new StripePaymentProvider();
    // case 'psp':
    //   return new PSPPaymentProvider();
    default:
      return mockPaymentProvider;
  }
}
