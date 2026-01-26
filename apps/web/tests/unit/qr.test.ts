/**
 * Unit tests for QR code signing and validation
 */

import { signQrPayload, verifyQrToken } from "@ticketing-platform/shared";

const QR_SECRET = "test-secret-key-for-qr-code-signing-validation";

describe("QR Code", () => {
  describe("signQrPayload", () => {
    it("should sign a QR payload correctly", () => {
      const payload = {
        tid: "ticket-id-123",
        eid: "event-id-456",
        nonce: "nonce-789",
      };

      const token = signQrPayload(payload, QR_SECRET);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
    });

    it("should produce different tokens for different payloads", () => {
      const payload1 = {
        tid: "ticket-id-1",
        eid: "event-id-1",
        nonce: "nonce-1",
      };

      const payload2 = {
        tid: "ticket-id-2",
        eid: "event-id-2",
        nonce: "nonce-2",
      };

      const token1 = signQrPayload(payload1, QR_SECRET);
      const token2 = signQrPayload(payload2, QR_SECRET);

      expect(token1).not.toBe(token2);
    });
  });

  describe("verifyQrToken", () => {
    it("should verify a valid QR token", () => {
      const payload = {
        tid: "ticket-id-123",
        eid: "event-id-456",
        nonce: "nonce-789",
      };

      const token = signQrPayload(payload, QR_SECRET);
      const verified = verifyQrToken(token, QR_SECRET);

      expect(verified).toBeDefined();
      expect(verified?.tid).toBe(payload.tid);
      expect(verified?.eid).toBe(payload.eid);
      expect(verified?.nonce).toBe(payload.nonce);
    });

    it("should reject an invalid token", () => {
      const invalidToken = "invalid-token-string";
      const verified = verifyQrToken(invalidToken, QR_SECRET);

      expect(verified).toBeNull();
    });

    it("should reject a token signed with different secret", () => {
      const payload = {
        tid: "ticket-id-123",
        eid: "event-id-456",
        nonce: "nonce-789",
      };

      const token = signQrPayload(payload, "different-secret");
      const verified = verifyQrToken(token, QR_SECRET);

      expect(verified).toBeNull();
    });

    it("should reject a tampered token", () => {
      const payload = {
        tid: "ticket-id-123",
        eid: "event-id-456",
        nonce: "nonce-789",
      };

      const token = signQrPayload(payload, QR_SECRET);
      const tamperedToken = token.slice(0, -5) + "XXXXX";
      const verified = verifyQrToken(tamperedToken, QR_SECRET);

      expect(verified).toBeNull();
    });
  });
});

