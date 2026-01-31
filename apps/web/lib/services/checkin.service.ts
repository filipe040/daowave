/**
 * Check-in QR e Segurança (Fase 5)
 * Valida assinatura HMAC, estado do ticket, janela de check-in; regista CheckinLog; resposta "já usado" com hora e operador.
 */

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { verifySignedQR } from "@/lib/qr/hmac";

export type VerifyCheckinInput = {
  qrCode: string;
  eventId: string;
  userId: string;
  userRole: string;
  deviceId?: string | null;
};

export type VerifyCheckinResult =
  | { success: true; ticket: { id: string; code: string; checkedInAt: Date } }
  | {
      success: false;
      message: string;
      checkedInAt?: Date;
      checkedInByUserId?: string | null;
      checkedInByName?: string | null;
    };

function rawPayloadHash(qrCode: string): string {
  return crypto.createHash("sha256").update(qrCode).digest("hex");
}

async function logCheckin(params: {
  ticketId: string;
  eventId: string;
  validatorUserId: string;
  deviceId: string | null;
  result: string;
  rawPayloadHash: string;
}) {
  await prisma.checkinLog.create({
    data: {
      ticketId: params.ticketId,
      eventId: params.eventId,
      validatorUserId: params.validatorUserId,
      deviceId: params.deviceId,
      result: params.result,
      rawPayloadHash: params.rawPayloadHash,
    },
  });
}

export const CheckinService = {
  /**
   * Verifica assinatura QR, janela de check-in, ticket/evento e acesso promotor; regista CheckinLog; faz check-in.
   * Resposta "já usado" inclui checkedInAt e checkedInByUserId (e opcionalmente nome do operador).
   */
  async verifyAndCheckin(input: VerifyCheckinInput): Promise<VerifyCheckinResult> {
    const { qrCode, eventId, userId, userRole, deviceId = null } = input;
    const hash = rawPayloadHash(qrCode);

    const verification = verifySignedQR(qrCode);
    if (!verification.valid || !verification.payload) {
      return { success: false, message: verification.error ?? "Invalid QR code" };
    }

    const { ticketId } = verification.payload;

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { event: true },
    });

    if (!ticket) {
      return { success: false, message: "Ticket not found" };
    }

    if (ticket.eventId !== eventId) {
      await logCheckin({
        ticketId: ticket.id,
        eventId: ticket.eventId,
        validatorUserId: userId,
        deviceId,
        result: "INVALID_EVENT",
        rawPayloadHash: hash,
      });
      return { success: false, message: "Ticket does not belong to this event" };
    }

    if (userRole === "PROMOTER") {
      const promoter = await prisma.promoterProfile.findUnique({
        where: { userId },
      });
      if (!promoter || ticket.event.promoterId !== promoter.id) {
        await logCheckin({
          ticketId: ticket.id,
          eventId: ticket.eventId,
          validatorUserId: userId,
          deviceId,
          result: "FORBIDDEN",
          rawPayloadHash: hash,
        });
        return { success: false, message: "You do not have access to this event" };
      }
    }

    const now = new Date();
    const event = ticket.event;
    if (event.checkinStartAt || event.checkinEndAt) {
      const start = event.checkinStartAt ? new Date(event.checkinStartAt).getTime() : 0;
      const end = event.checkinEndAt ? new Date(event.checkinEndAt).getTime() : Infinity;
      if (now.getTime() < start) {
        await logCheckin({
          ticketId: ticket.id,
          eventId: ticket.eventId,
          validatorUserId: userId,
          deviceId,
          result: "OUTSIDE_WINDOW",
          rawPayloadHash: hash,
        });
        return { success: false, message: "Check-in ainda não está aberto para este evento" };
      }
      if (now.getTime() > end) {
        await logCheckin({
          ticketId: ticket.id,
          eventId: ticket.eventId,
          validatorUserId: userId,
          deviceId,
          result: "OUTSIDE_WINDOW",
          rawPayloadHash: hash,
        });
        return { success: false, message: "Janela de check-in já terminou para este evento" };
      }
    }

    if (ticket.checkedInAt) {
      await logCheckin({
        ticketId: ticket.id,
        eventId: ticket.eventId,
        validatorUserId: userId,
        deviceId,
        result: "ALREADY_USED",
        rawPayloadHash: hash,
      });
      let checkedInByName: string | null = null;
      if (ticket.checkedInByUserId) {
        const u = await prisma.user.findUnique({
          where: { id: ticket.checkedInByUserId },
          select: { name: true },
        });
        checkedInByName = u?.name ?? null;
      }
      return {
        success: false,
        message: "Ticket already checked in",
        checkedInAt: ticket.checkedInAt,
        checkedInByUserId: ticket.checkedInByUserId,
        checkedInByName,
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.ticket.update({
        where: { id: ticket.id },
        data: { checkedInAt: now, checkedInByUserId: userId },
      });
      await tx.checkinLog.create({
        data: {
          ticketId: ticket.id,
          eventId: ticket.eventId,
          validatorUserId: userId,
          deviceId,
          result: "VALID",
          rawPayloadHash: hash,
        },
      });
    });

    return {
      success: true,
      ticket: { id: ticket.id, code: ticket.code, checkedInAt: now },
    };
  },
};
