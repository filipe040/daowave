import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyQrToken } from "@/lib/qr";
import crypto from "crypto";
import type { OfflineCheckinLog } from "@ticketing-platform/shared";
import { z } from "zod";

const SyncSchema = z.object({
  logs: z.array(
    z.object({
      ticketId: z.string().uuid(),
      eventId: z.string().uuid(),
      deviceId: z.string(),
      scannedAt: z.string(),
      result: z.string(),
      rawPayloadHash: z.string(),
      qrToken: z.string(),
    })
  ),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "USER" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id; // Store for use in transaction

    const body = await req.json();
    const { logs } = SyncSchema.parse(body);

    const results = [];

    for (const log of logs) {
      // Verify token signature
      const payload = verifyQrToken(log.qrToken);
      if (!payload || payload.tid !== log.ticketId || payload.eid !== log.eventId) {
        results.push({
          ticketId: log.ticketId,
          success: false,
          error: "Invalid token",
        });
        continue;
      }

      // Process check-in atomically (first wins)
      try {
        const result = await prisma.$transaction(async (tx) => {
          const ticket = await tx.ticket.findUnique({
            where: { id: log.ticketId },
            include: {
              event: true,
            },
          });

          if (!ticket || ticket.checkedInAt) {
            return { success: false, error: "Invalid ticket" };
          }

          // Check if already synced
          const existingLog = await tx.checkinLog.findFirst({
            where: {
              ticketId: log.ticketId,
              rawPayloadHash: log.rawPayloadHash,
              syncedAt: { not: null },
            },
          });

          if (existingLog) {
            return { success: true, skipped: true, message: "Already synced" };
          }

          // TODO: Add checkinMode to Event model 
          // Default to SINGLE mode for now

          // Check if already checked in
          if (ticket.checkedInAt) {
            // Conflict: already checked in, but offline log says valid
            // First check-in wins, so we mark as already used
            await tx.checkinLog.create({
              data: {
                ticketId: log.ticketId,
                eventId: log.eventId,
                validatorUserId: userId,
                deviceId: log.deviceId,
                result: "ALREADY_USED",
                scannedAt: new Date(log.scannedAt),
                offline: true,
                syncedAt: new Date(),
                rawPayloadHash: log.rawPayloadHash,
              },
            });
            return { success: true, conflict: true, message: "Already checked in" };
          }

          // Apply check-in
          if (log.result === "VALID") {
            await tx.ticket.update({
              where: { id: log.ticketId },
              data: {
                checkedInAt: new Date(log.scannedAt),
                checkedInByUserId: userId,
                status: 'USED' as any // Force status update
              },
            });
          }

          // Create synced log
          await tx.checkinLog.create({
            data: {
              ticketId: log.ticketId,
              eventId: log.eventId,
              validatorUserId: session.user.id,
              deviceId: log.deviceId,
              result: log.result,
              scannedAt: new Date(log.scannedAt),
              offline: true,
              syncedAt: new Date(),
              rawPayloadHash: log.rawPayloadHash,
            },
          });

          return { success: true, message: "Synced successfully" };
        });

        results.push({
          ticketId: log.ticketId,
          ...result,
        });
      } catch (error) {
        results.push({
          ticketId: log.ticketId,
          success: false,
          error: "Transaction failed",
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
