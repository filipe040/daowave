/**
 * Payment Provider Interface
 * Abstract layer for payment processing
 */

export interface PaymentIntent {
  id: string;
  amount: number; // in cents
  currency: string;
  status: 'pending' | 'succeeded' | 'failed';
  clientSecret?: string;
  metadata?: Record<string, string>;
}

export interface PaymentResult {
  success: boolean;
  paymentRef: string;
  error?: string;
}

export interface IPaymentProvider {
  /**
   * Create a payment intent
   */
  createIntent(params: {
    amount: number;
    currency: string;
    orderId: string;
    metadata?: Record<string, string>;
  }): Promise<PaymentIntent>;

  /**
   * Confirm/complete a payment
   */
  confirmPayment(paymentRef: string): Promise<PaymentResult>;

  /**
   * Get payment status
   */
  getStatus(paymentRef: string): Promise<PaymentIntent | null>;
}
