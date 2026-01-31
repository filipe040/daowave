/**
 * Unit tests for QR code signing and validation
 * Uses TicketQrPayload shape: v, tid, eid, n, iat (packages/shared)
 */

import { signQrPayload, verifyQrToken } from "@ticketing-platform/shared";

const QR_SECRET = "test-secret-key-for-qr-code-signing-validation";

const validPayload = () => ({
  v: 1 as const,
  tid: "550e8400-e29b-41d4-a716-446655440000",
  eid: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  n: "nonce-789-abcdef",
  iat: Math.floor(Date.now() / 1000),
});

describe("QR Code", () => {
  describe("signQrPayload", () => {
    it("should sign a QR payload correctly", () => {
      const token = signQrPayload(validPayload(), QR_SECRET);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
    });

    it("should produce different tokens for different payloads", () => {
      const payload1 = { ...validPayload(), tid: "550e8400-e29b-41d4-a716-446655440001", n: "nonce-1" };
      const payload2 = { ...validPayload(), tid: "550e8400-e29b-41d4-a716-446655440002", n: "nonce-2" };

      const token1 = signQrPayload(payload1, QR_SECRET);
      const token2 = signQrPayload(payload2, QR_SECRET);

      expect(token1).not.toBe(token2);
    });
  });

  describe("verifyQrToken", () => {
    it("should verify a valid QR token", () => {
      const payload = validPayload();
      const token = signQrPayload(payload, QR_SECRET);
      const verified = verifyQrToken(token, QR_SECRET);

      expect(verified).toBeDefined();
      expect(verified?.tid).toBe(payload.tid);
      expect(verified?.eid).toBe(payload.eid);
      expect(verified?.n).toBe(payload.n);
    });

    it("should reject an invalid token", () => {
      const invalidToken = "invalid-token-string";
      const verified = verifyQrToken(invalidToken, QR_SECRET);

      expect(verified).toBeNull();
    });

    it("should reject a token signed with different secret", () => {
      const payload = validPayload();
      const token = signQrPayload(payload, "different-secret");
      const verified = verifyQrToken(token, QR_SECRET);

      expect(verified).toBeNull();
    });

    it("should reject a tampered token", () => {
      const payload = validPayload();
      const token = signQrPayload(payload, QR_SECRET);
      const tamperedToken = token.slice(0, -5) + "XXXXX";
      const verified = verifyQrToken(tamperedToken, QR_SECRET);

      expect(verified).toBeNull();
    });
  });
});

