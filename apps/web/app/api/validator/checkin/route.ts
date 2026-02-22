import { prisma } from "@/lib/prisma";
import { verifyQrToken as verifyQrTokenShared } from "@ticketing-platform/shared";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import crypto from "crypto";
import { applyRateLimit, RATE_LIMITS, safeLog, getRequestMetadata } from "@/lib/security";
import { createAuditLog } from "@/lib/audit";

const QR_SECRET = process.env.QR_SECRET || "change-me-in-production";

export async function POST(req: Request) {
  try {
    // Rate limiting
    const rateLimitResponse = await applyRateLimit(req, RATE_LIMITS.validatorCheckin);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "USER" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { token, deviceId = "UNKNOWN", eventId } = body;

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    // Sanitize token for logging (only log hash, not full token)
    const rawHash = crypto.createHash("sha256").update(token).digest("hex");
    const payload = verifyQrTokenShared(token, QR_SECRET);

    let ticket;

    if (payload) {
      ticket = await prisma.ticket.findUnique({
        where: { id: payload.tid },
        include: { event: true },
      });
    } else {
      // Fallback: search by ticket code (manual validation)
      const code = token.trim().toUpperCase();
      ticket = await prisma.ticket.findFirst({
        where: { code },
        include: { event: true },
      });
    }

    if (!ticket) {
      return NextResponse.json({
        valid: false,
        result: "invalid",
        message: "Bilhete não encontrado",
      });
    }

    // Verify event matches if provided
    if (eventId && ticket.eventId !== eventId) {
      await prisma.checkinLog.create({
        data: {
          ticketId: ticket.id,
          eventId: ticket.eventId,
          validatorUserId: session.user.id,
          deviceId,
          result: "INVALID_EVENT",
          rawPayloadHash: rawHash,
        },
      });
      return NextResponse.json({
        valid: false,
        result: "invalid",
        message: "Bilhete não é para este evento",
      });
    }

    // status field doesn't exist in Ticket model, check checkedInAt instead
    if (ticket.checkedInAt) {
      await prisma.checkinLog.create({
        data: {
          ticketId: ticket.id,
          eventId: ticket.eventId,
          validatorUserId: session.user.id,
          deviceId,
          result: "INVALID",
          rawPayloadHash: rawHash,
        },
      });
      return NextResponse.json({
        valid: false,
        result: "invalid",
        message: "Bilhete não é válido",
      });
    }

    // Atomic check-in transaction
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.ticket.findUnique({
        where: { id: ticket.id },
      });

      if (!current) {
        return { valid: false, result: "invalid", message: "Bilhete não encontrado" };
      }

      // Check if already checked in
      if (current.checkedInAt) {
        await tx.checkinLog.create({
          data: {
            ticketId: current.id,
            eventId: current.eventId,
            validatorUserId: session.user.id,
            deviceId,
            result: "ALREADY_USED",
            rawPayloadHash: rawHash,
          },
        });
        return {
          valid: false,
          result: "already_used",
          message: "Bilhete já utilizado",
          checkedInAt: current.checkedInAt,
        };
      }

      const now = new Date();
      await tx.ticket.update({
        where: { id: current.id },
        data: {
          checkedInAt: now,
          checkedInByUserId: session.user.id,
        },
      });

      await tx.checkinLog.create({
        data: {
          ticketId: current.id,
          eventId: current.eventId,
          validatorUserId: session.user.id,
          deviceId,
          result: "VALID",
          rawPayloadHash: rawHash,
        },
      });

      return {
        valid: true,
        result: "valid",
        message: "Check-in realizado com sucesso",
        ticketId: current.id,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
