import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyQrToken } from "@/lib/qr";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "USER" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { token, deviceId = "UNKNOWN", eventId } = body;

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const payload = verifyQrToken(token);
    const rawHash = crypto.createHash("sha256").update(token).digest("hex");

    if (!payload) {
      return NextResponse.json({
        valid: false,
        result: "invalid",
        message: "Assinatura inválida",
      });
    }

    // Verify event matches if provided
    if (eventId && payload.eid !== eventId) {
      return NextResponse.json({
        valid: false,
        result: "invalid",
        message: "Bilhete não pertence a este evento",
      });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: payload.tid },
      include: {
        event: true,
      },
    });

    if (!ticket) {
      return NextResponse.json({
        valid: false,
        result: "invalid",
        message: "Bilhete não encontrado",
      });
    }

    if (ticket.checkedInAt) {
      await prisma.checkinLog.create({
        data: {
          ticketId: ticket.id,
          eventId: ticket.eventId,
          validatorUserId: session.user.id,
          deviceId,
          result: "INVALID_STATUS",
          offline: false,
          rawPayloadHash: rawHash,
        },
      });
      return NextResponse.json({
        valid: false,
        result: "invalid",
        message: "Bilhete cancelado ou transferido",
      });
    }

    // TODO: Add checkinStartAt and checkinEndAt to Event model
    // Check validation window
    // const now = new Date();
    // if (ticket.event.checkinStartAt && now < ticket.event.checkinStartAt) {
    //   return NextResponse.json({
    //     valid: false,
    //     result: "not_in_window",
    //     message: "Check-in ainda não está disponível",
    //   });
    // }

    // if (ticket.event.checkinEndAt && now > ticket.event.checkinEndAt) {
    //   return NextResponse.json({
    //     valid: false,
    //     result: "not_in_window",
    //     message: "Período de check-in expirou",
    //   });
    // }

    // Atomic check-in based on mode
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.ticket.findUnique({
        where: { id: ticket.id },
      });

      if (!current) {
        return { valid: false, result: "invalid", message: "Bilhete não encontrado" };
      }

      // TODO: Add checkinMode to Event model and entriesUsed/lastCheckinAt to Ticket model
      // For now, use SINGLE mode (check if already checked in)
      // Single entry: check if already used
      if (current.checkedInAt) { // Use checkedInAt instead of entriesUsed
          await tx.checkinLog.create({
            data: {
              ticketId: current.id,
              eventId: current.eventId,
              validatorUserId: session.user.id,
              deviceId,
              result: "ALREADY_USED",
              offline: false,
              rawPayloadHash: rawHash,
            },
          });
          return {
            valid: false,
            result: "already_used",
            message: "Bilhete já utilizado",
            // lastCheckinAt: current.lastCheckinAt,
          };
        }

        // Mark as checked in
        const checkinAt = new Date();
        await tx.ticket.update({
          where: { id: current.id },
          data: {
            checkedInAt: checkinAt,
            checkedInByUserId: session.user.id,
            // entriesUsed: 1,
            // lastCheckinAt: checkinAt,
          },
        });

        await tx.checkinLog.create({
          data: {
            ticketId: current.id,
            eventId: current.eventId,
            validatorUserId: session.user.id,
            deviceId,
            result: "VALID",
            offline: false,
            rawPayloadHash: rawHash,
          },
        });

        return {
          valid: true,
          result: "valid",
          message: "Check-in realizado com sucesso",
          ticketId: current.id,
          // entriesUsed: 1,
          // maxEntries: 1,
        };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Validate error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
