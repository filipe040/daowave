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
        event: {
          select: {
            id: true,
            title: true,
            checkinMode: true,
            checkinStartAt: true,
            checkinEndAt: true,
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({
        valid: false,
        result: "invalid",
        message: "Bilhete não encontrado",
      });
    }

    // Check validation window
    const now = new Date();
    if (ticket.event.checkinStartAt && now < new Date(ticket.event.checkinStartAt)) {
      return NextResponse.json({
        valid: false,
        result: "not_in_window",
        message: "Check-in ainda não está disponível",
      });
    }

    if (ticket.event.checkinEndAt && now > new Date(ticket.event.checkinEndAt)) {
      return NextResponse.json({
        valid: false,
        result: "not_in_window",
        message: "Período de check-in expirou",
      });
    }

    // Atomic Check-in
    if (ticket.checkedInAt) {
      await prisma.checkinLog.create({
        data: {
          ticketId: ticket.id,
          eventId: ticket.eventId,
          validatorUserId: session.user.id,
          deviceId,
          result: "ALREADY_USED",
          offline: false,
          rawPayloadHash: rawHash,
        },
      });
      return NextResponse.json({
        valid: false,
        result: "already_used",
        message: "Bilhete já utilizado",
        lastCheckinAt: ticket.checkedInAt,
      });
    }

    await prisma.$transaction([
      prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          checkedInAt: new Date(),
          checkedInByUserId: session.user.id,
          status: 'USED'
        }
      }),
      prisma.checkinLog.create({
        data: {
          ticketId: ticket.id,
          eventId: ticket.eventId,
          validatorUserId: session.user.id,
          deviceId,
          result: "VALID",
          offline: false,
          rawPayloadHash: rawHash,
        }
      })
    ]);

    return NextResponse.json({
      valid: true,
      result: "valid",
      message: "Check-in realizado com sucesso",
      ticketId: ticket.id,
      entriesUsed: 1,
      maxEntries: 1,
    });

  } catch (error) {
    console.error("Validate error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
