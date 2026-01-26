/**
 * QR Code Generation
 * Generates QR codes for tickets
 */

import QRCode from 'qrcode';
import { createSignedQR, type QRPayload } from './hmac';

export interface TicketQRData {
  ticketId: string;
  code: string;
  exp?: number; // optional expiration timestamp
}

/**
 * Generate QR code image data URL
 */
export async function generateQRCode(data: TicketQRData): Promise<string> {
  const payload: QRPayload = {
    ticketId: data.ticketId,
    code: data.code,
    exp: data.exp,
  };

  const signedQR = createSignedQR(payload);
  
  const qrDataUrl = await QRCode.toDataURL(signedQR, {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    width: 300,
    margin: 2,
  });

  return qrDataUrl;
}

/**
 * Get signed QR payload string (for storage in DB)
 */
export function getQRPayload(data: TicketQRData): string {
  const payload: QRPayload = {
    ticketId: data.ticketId,
    code: data.code,
    exp: data.exp,
  };

  return createSignedQR(payload);
}
