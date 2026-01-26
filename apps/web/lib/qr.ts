import QRCode from "qrcode";
import { signQrPayload, verifyQrToken as verifyQrTokenShared, TicketQrPayload } from "@ticketing-platform/shared";
import crypto from "crypto";

const QR_SECRET = process.env.QR_SECRET || "change-me-in-production";

export async function generateQrCodeDataUrl(ticketId: string, eventId: string, qrNonce: string): Promise<string> {
  const payload: TicketQrPayload = {
    v: 1,
    tid: ticketId,
    eid: eventId,
    n: qrNonce,
    iat: Math.floor(Date.now() / 1000),
  };

  const token = signQrPayload(payload, QR_SECRET);
  return QRCode.toDataURL(token, { errorCorrectionLevel: "M", width: 300 });
}

export function generateQrToken(ticketId: string, eventId: string, qrNonce: string): string {
  const payload: TicketQrPayload = {
    v: 1,
    tid: ticketId,
    eid: eventId,
    n: qrNonce,
    iat: Math.floor(Date.now() / 1000),
  };

  return signQrPayload(payload, QR_SECRET);
}

export function verifyQrToken(token: string): TicketQrPayload | null {
  return verifyQrTokenShared(token, QR_SECRET);
}

export function generateQrNonce(): string {
  return crypto.randomBytes(16).toString("hex");
}