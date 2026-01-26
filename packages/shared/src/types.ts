import type { Role } from "./rbac";

export type EventStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED" | "CANCELLED";
export type OrganizerStatus = "PENDING" | "APPROVED" | "REJECTED";
export type OrderStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type TicketStatus = "ISSUED" | "TRANSFERRED_OUT" | "TRANSFERRED_IN" | "CANCELLED" | "REFUNDED" | "VOID";
export type PaymentProvider = "MBWAY" | "MULTIBANCO" | "PAYPAL";
export type CheckinMode = "SINGLE" | "MULTI";

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
}

export interface CheckoutItem {
  ticketLotId: string;
  quantity: number;
  attendees: Array<{
    name: string;
    email: string;
  }>;
}

export interface ValidateTicketResult {
  valid: boolean;
  result: "valid" | "invalid" | "already_used" | "cancelled" | "not_in_window";
  message: string;
  ticketId?: string;
  entriesUsed?: number;
  maxEntries?: number;
  lastCheckinAt?: Date;
}

export interface SyncTicket {
  ticketId: string;
  qrNonce: string;
  eventId: string;
  checkinMode: CheckinMode;
  maxEntries?: number;
  entriesUsed: number;
  qrToken: string; // Pre-signed token for offline validation
}

export interface OfflineCheckinLog {
  ticketId: string;
  eventId: string;
  deviceId: string;
  scannedAt: string;
  result: string;
  rawPayloadHash: string;
  qrToken: string;
}