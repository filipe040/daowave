/**
 * Mock Payment Provider
 * Simulates payment processing for development/testing
 */

import type { IPaymentProvider, PaymentIntent, PaymentResult } from './provider';

export class MockPaymentProvider implements IPaymentProvider {
  private payments: Map<string, PaymentIntent> = new Map();

  async createIntent(params: {
    amount: number;
    currency: string;
    orderId: string;
    metadata?: Record<string, string>;
  }): Promise<PaymentIntent> {
    const id = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const intent: PaymentIntent = {
      id,
      amount: params.amount,
      currency: params.currency,
      status: 'pending',
      clientSecret: `mock_secret_${id}`,
      metadata: {
        orderId: params.orderId,
        ...params.metadata,
      },
    };

    this.payments.set(id, intent);
    return intent;
  }

  async confirmPayment(paymentRef: string): Promise<PaymentResult> {
    const intent = this.payments.get(paymentRef);
    
    if (!intent) {
      return {
        success: false,
        paymentRef,
        error: 'Payment intent not found',
      };
    }

    // Simulate payment success
    intent.status = 'succeeded';
    this.payments.set(paymentRef, intent);

    return {
      success: true,
      paymentRef,
    };
  }

  async getStatus(paymentRef: string): Promise<PaymentIntent | null> {
    return this.payments.get(paymentRef) || null;
  }
}

// Singleton instance
export const mockPaymentProvider = new MockPaymentProvider();
