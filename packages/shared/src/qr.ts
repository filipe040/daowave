import crypto from "crypto";
import { z } from "zod";

export const TicketQrPayloadSchema = z.object({
  v: z.literal(1),
  tid: z.string().uuid(),
  eid: z.string().uuid(),
  n: z.string().min(8),
  iat: z.number().int().positive(),
});

export type TicketQrPayload = z.infer<typeof TicketQrPayloadSchema>;

function b64url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input) : input;
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromB64url(input: string): Buffer {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(b64, "base64");
}

export function signQrPayload(payload: TicketQrPayload, secret: string): string {
  const body = b64url(JSON.stringify(payload));
  const sig = crypto.createHmac("sha256", secret).update(body).digest();
  return `${body}.${b64url(sig)}`;
}

export function verifyQrToken(token: string, secret: string): TicketQrPayload | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;

  try {
    const expected = crypto.createHmac("sha256", secret).update(body).digest();
    const got = fromB64url(sig);
    
    if (got.length !== expected.length) return null;
    if (!crypto.timingSafeEqual(got, expected)) return null;

    const json = JSON.parse(fromB64url(body).toString("utf8"));
    return TicketQrPayloadSchema.parse(json);
  } catch {
    return null;
  }
}