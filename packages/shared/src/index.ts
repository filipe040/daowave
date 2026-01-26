export * from "./qr";
export * from "./rbac";
export * from "./types";

// Payment provider interface
export interface PaymentCreateRequest {
  orderId: string;
  amount: number;
  currency: string;
  returnUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface PaymentCreateResponse {
  paymentId: string;
  status: "pending" | "processing";
  paymentUrl?: string;
  reference?: string; // For Multibanco/MBWay
  expiresAt?: Date;
}

export interface PaymentWebhookPayload {
  paymentId: string;
  orderId: string;
  status: "paid" | "failed" | "cancelled";
  amount: number;
  currency: string;
  metadata?: Record<string, any>;
}
