import type { PaymentCreateRequest, PaymentCreateResponse, PaymentWebhookPayload } from "@ticketing-platform/shared";

export interface IPaymentProvider {
  createPayment(request: PaymentCreateRequest): Promise<PaymentCreateResponse>;
  verifyWebhook(signature: string, payload: string): boolean;
  parseWebhook(payload: any): PaymentWebhookPayload | null;
  getProviderName(): string;
}

// MBWay Provider (stub for development)
export class MBWayProvider implements IPaymentProvider {
  getProviderName(): string {
    return "MBWAY";
  }

  async createPayment(request: PaymentCreateRequest): Promise<PaymentCreateResponse> {
    // Stub: In production, integrate with MBWay API
    const paymentId = `mbway_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      paymentId,
      status: "pending",
      reference: `MBWAY${paymentId.slice(-8).toUpperCase()}`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    };
  }

  verifyWebhook(signature: string, payload: string): boolean {
    // Stub: In production, verify MBWay signature
    return true;
  }

  parseWebhook(payload: any): PaymentWebhookPayload | null {
    // Stub: In production, parse MBWay webhook
    if (payload.status === "paid") {
      return {
        paymentId: payload.paymentId,
        orderId: payload.metadata?.orderId,
        status: "paid",
        amount: payload.amount,
        currency: payload.currency || "EUR",
        metadata: payload.metadata,
      };
    }
    return null;
  }
}

// Multibanco Reference Provider (stub)
export class MultibancoProvider implements IPaymentProvider {
  getProviderName(): string {
    return "MULTIBANCO";
  }

  async createPayment(request: PaymentCreateRequest): Promise<PaymentCreateResponse> {
    // Stub: In production, generate Multibanco reference
    const entity = "12345"; // Entity code
    const reference = `${Math.floor(Math.random() * 1000000000).toString().padStart(9, "0")}`;
    
    return {
      paymentId: `multibanco_${Date.now()}`,
      status: "pending",
      reference: `${entity} ${reference.slice(0, 3)} ${reference.slice(3, 6)} ${reference.slice(6)}`,
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
    };
  }

  verifyWebhook(signature: string, payload: string): boolean {
    // Stub: In production, verify provider signature
    return true;
  }

  parseWebhook(payload: any): PaymentWebhookPayload | null {
    if (payload.status === "paid") {
      return {
        paymentId: payload.paymentId,
        orderId: payload.metadata?.orderId,
        status: "paid",
        amount: payload.amount,
        currency: payload.currency || "EUR",
        metadata: payload.metadata,
      };
    }
    return null;
  }
}

// PayPal Provider (stub)
export class PayPalProvider implements IPaymentProvider {
  getProviderName(): string {
    return "PAYPAL";
  }

  async createPayment(request: PaymentCreateRequest): Promise<PaymentCreateResponse> {
    // Stub: In production, use PayPal SDK
    const paymentId = `paypal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      paymentId,
      status: "pending",
      paymentUrl: `https://paypal.example.com/checkout/${paymentId}`,
    };
  }

  verifyWebhook(signature: string, payload: string): boolean {
    // Stub: In production, verify PayPal signature
    return true;
  }

  parseWebhook(payload: any): PaymentWebhookPayload | null {
    if (payload.status === "paid" || payload.event_type === "PAYMENT.CAPTURE.COMPLETED") {
      return {
        paymentId: payload.paymentId || payload.resource?.id,
        orderId: payload.metadata?.orderId,
        status: "paid",
        amount: payload.amount?.value * 100 || payload.resource?.amount?.value * 100,
        currency: payload.amount?.currency || payload.resource?.amount?.currency || "EUR",
        metadata: payload.metadata,
      };
    }
    return null;
  }
}

// Provider factory
export function getPaymentProvider(provider: "MBWAY" | "MULTIBANCO" | "PAYPAL"): IPaymentProvider {
  switch (provider) {
    case "MBWAY":
      return new MBWayProvider();
    case "MULTIBANCO":
      return new MultibancoProvider();
    case "PAYPAL":
      return new PayPalProvider();
    default:
      throw new Error(`Unknown payment provider: ${provider}`);
  }
}
