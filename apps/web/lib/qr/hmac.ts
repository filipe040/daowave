/**
 * QR Code HMAC Signing
 * Signs and verifies QR code payloads for ticket validation
 */

import crypto from 'crypto';

const HMAC_SECRET = process.env.QR_HMAC_SECRET || 'change-me-in-production';
const HMAC_ALGORITHM = 'sha256';

export interface QRPayload {
  ticketId: string;
  code: string;
  exp?: number; // optional expiration timestamp
}

/**
 * Generate HMAC signature for payload
 */
export function signPayload(payload: QRPayload): string {
  const payloadStr = JSON.stringify(payload);
  const hmac = crypto.createHmac(HMAC_ALGORITHM, HMAC_SECRET);
  hmac.update(payloadStr);
  return hmac.digest('hex');
}

/**
 * Create signed QR payload (base64 encoded JSON + signature)
 */
export function createSignedQR(payload: QRPayload): string {
  const payloadStr = JSON.stringify(payload);
  const signature = signPayload(payload);
  const signed = {
    payload: payloadStr,
    sig: signature,
  };
  return Buffer.from(JSON.stringify(signed)).toString('base64');
}

/**
 * Verify and decode signed QR payload
 */
export function verifySignedQR(encoded: string): { valid: boolean; payload?: QRPayload; error?: string } {
  try {
    const decoded = JSON.parse(Buffer.from(encoded, 'base64').toString());
    
    if (!decoded.payload || !decoded.sig) {
      return { valid: false, error: 'Invalid QR format' };
    }

    const payload: QRPayload = JSON.parse(decoded.payload);
    const expectedSig = signPayload(payload);

    if (decoded.sig !== expectedSig) {
      return { valid: false, error: 'Invalid signature' };
    }

    // Check expiration if present
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return { valid: false, error: 'QR code expired' };
    }

    return { valid: true, payload };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Invalid QR code' 
    };
  }
}
