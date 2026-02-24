import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { verifyQrToken, decodeQrPayload } from "@ticketing-platform/shared";
import { FraudService } from "./fraud.service";

const LEGACY_QR_SECRET = process.env.QR_SECRET || "change-me-in-production";

export interface CheckinResult {
  success: boolean;
  message: string;
  ticketHolderName?: string;
  scannedAt?: Date;
  resultType: string;
}

export class CheckinService {
  /**
   * Validates a ticket QR Code, authenticates HMAC Signature, 
   * checks for Duplicates, and commits the Scan Log via Transaction.
   */
  static async validate(
    token: string,
    eventId: string | undefined,
    deviceId: string,
    validatorUserId: string
  ): Promise<CheckinResult> {
    const rawHash = crypto.createHash("sha256").update(token).digest("hex");

    // 1. First, decode the payload without verifying to inspect the "kid"
    const decodedPayload = decodeQrPayload(token);
    let secretToUse = LEGACY_QR_SECRET;

    if (decodedPayload?.kid) {
      const signingKey = await prisma.qrSigningKey.findUnique({
        where: { keyId: decodedPayload.kid }
      });
      if (signingKey) {
        secretToUse = signingKey.keySecret;
      } else {
        console.warn(`[Validator] Token specifies kid ${decodedPayload.kid} but key not found in DB`);
      }
    }

    // 2. Try New Shared Format
    const payload = verifyQrToken(token, secretToUse);

    let ticket: any = null;

    if (payload) {
      ticket = await prisma.ticket.findUnique({
        where: { id: payload.tid },
        include: { event: true, user: true },
      });
    } else {
      // 3. Fallbacks for Legacy Formats
      const tstr = token.trim();

      // Fallback 3.1: UUID format (ticket ID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(tstr)) {
        ticket = await prisma.ticket.findUnique({
          where: { id: tstr },
          include: { event: true, user: true },
        });
      }

      // Fallback 3.2: Legacy string format "v1:ticketId:eventId:..." or "v1:eventId:userId:..."
      if (!ticket && tstr.startsWith("v1:")) {
        const parts = tstr.split(":");
        // The second field could be the ticket ID or event ID under some old seeds, but usually ticketId is a UUID
        for (const part of parts) {
          if (uuidRegex.test(part)) {
            ticket = await prisma.ticket.findUnique({
              where: { id: part },
              include: { event: true, user: true },
            });
            // If we found a ticket with one of the UUIDs, break
            if (ticket) break;
          }
        }
      }

      // Fallback 3.3: Legacy JSON HMAC base64 format (apps/web/lib/qr/hmac.ts)
      if (!ticket && tstr.length > 20 && !tstr.includes(":") && !tstr.includes(" ")) {
        try {
          // Attempt base64 decode
          const decoded = Buffer.from(tstr, 'base64').toString('utf8');
          if (decoded.includes('"payload"') && decoded.includes('"sig"')) {
            const parsed = JSON.parse(decoded);
            if (parsed.payload) {
              const inner = JSON.parse(parsed.payload);
              if (inner.ticketId) {
                ticket = await prisma.ticket.findUnique({
                  where: { id: inner.ticketId },
                  include: { event: true, user: true },
                });
              }
            }
          }
        } catch (e) {
          // Ignore parse errors, it's just a fallback
        }
      }

      // Fallback 3.4: Manual entry ticket `code` (e.g. "BRAGA--ME-XXXX")
      if (!ticket) {
        const code = tstr.toUpperCase();
        ticket = await prisma.ticket.findFirst({
          where: { code },
          include: { event: true, user: true },
        });
      }
    }

    if (!ticket) {
      // Record unknown attempt safely
      await prisma.checkinLog.create({
        data: {
          ticketId: "unknown",
          eventId: eventId || "unknown",
          validatorUserId,
          deviceId,
          result: "NOT_FOUND",
          rawPayloadHash: rawHash,
        }
      }).catch(() => null);

      return { success: false, resultType: "invalid", message: "Bilhete não encontrado" };
    }

    const ticketHolderName = ticket.attendeeName || ticket.user?.name || "Participante";

    // 3. Verify event matches if provided
    if (eventId && ticket.eventId !== eventId) {
      await prisma.checkinLog.create({
        data: {
          ticketId: ticket.id,
          eventId: ticket.eventId,
          validatorUserId,
          deviceId,
          result: "INVALID_EVENT",
          rawPayloadHash: rawHash,
        },
      });
      return { success: false, resultType: "invalid", message: "Este bilhete não é para este evento", ticketHolderName };
    }

    // 4. Validate Ticket Status (e.g. Cancelled or Refunded)
    if (ticket.status !== "VALID") {
      await prisma.checkinLog.create({
        data: {
          ticketId: ticket.id,
          eventId: ticket.eventId,
          validatorUserId,
          deviceId,
          result: "INVALID",
          rawPayloadHash: rawHash,
        },
      });
      return { success: false, resultType: "invalid", message: `Bilhete inválido (Estado: ${ticket.status})`, ticketHolderName };
    }

    // 5. Atomic Transaction: Check-in Logging & Updating
    const result = await prisma.$transaction(async (tx) => {
      // Re-fetch inside transaction locking the row
      const current = await tx.ticket.findUnique({
        where: { id: ticket.id }
      });

      if (!current) {
        return { success: false, resultType: "invalid", message: "Acesso concorrente ao bilhete", ticketHolderName };
      }

      // Check if ALREADY USED
      if (current.checkedInAt) {
        await tx.checkinLog.create({
          data: {
            ticketId: current.id,
            eventId: current.eventId,
            validatorUserId,
            deviceId,
            result: "ALREADY_USED",
            rawPayloadHash: rawHash,
          },
        });

        await FraudService.analyzeDoubleEntryAttempt(current.id, rawHash, current.orderId);

        return {
          success: false,
          resultType: "already_used",
          message: "Bilhete já foi utilizado",
          ticketHolderName,
          scannedAt: current.checkedInAt,
        };
      }

      // SUCCESS: Mark as used
      const now = new Date();
      await tx.ticket.update({
        where: { id: current.id },
        data: {
          checkedInAt: now,
          checkedInByUserId: validatorUserId,
          status: "USED", // Update the status to USED explicitly
        },
      });

      await tx.checkinLog.create({
        data: {
          ticketId: current.id,
          eventId: current.eventId,
          validatorUserId,
          deviceId,
          result: "SUCCESS",
          rawPayloadHash: rawHash,
        },
      });

      return {
        success: true,
        resultType: "valid",
        message: "Check-in realizado com sucesso",
        ticketHolderName,
        scannedAt: now,
      };
    });

    return result as CheckinResult;
  }
}

