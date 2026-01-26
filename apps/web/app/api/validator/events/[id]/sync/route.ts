import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateQrToken } from "@/lib/qr";
import type { SyncTicket } from "@ticketing-platform/shared";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "USER" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: eventId } = await params;

    // TODO: Add ValidatorAssignment model to Prisma schema
    // Verify validator has access to this event
    // const assignment = await prisma.validatorAssignment.findUnique({
    //   where: {
    //     eventId_validatorUserId: {
    //       eventId,
    //       validatorUserId: session.user.id,
    //     },
    //   },
    // });

    // For now, allow ADMIN only until ValidatorAssignment model is added
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get event with check-in config (using any to bypass type errors until Prisma Client is regenerated)
    const event = await (prisma.event.findUnique({
      where: { id: eventId },
    }) as any) as {
      id: string;
      checkinMode: "SINGLE" | "MULTI";
      maxEntries: number | null;
      checkinStartAt: Date | null;
      checkinEndAt: Date | null;
    };

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Get all valid tickets for this event (using any to bypass type errors)
    const tickets = await (prisma.ticket.findMany({
      where: {
        eventId,
        checkedInAt: null, // Only get tickets that haven't been checked in
      },
    }) as any) as Array<{
      id: string;
      eventId: string;
      qrNonce: string;
      entriesUsed: number;
    }>;

    // Generate pre-signed tokens for offline validation
    const syncTickets: SyncTicket[] = tickets.map((ticket) => ({
      ticketId: ticket.id,
      qrNonce: ticket.qrNonce,
      eventId: ticket.eventId,
      checkinMode: event.checkinMode,
      maxEntries: event.maxEntries || undefined,
      entriesUsed: ticket.entriesUsed,
      qrToken: generateQrToken(ticket.id, ticket.eventId, ticket.qrNonce),
    }));

    return NextResponse.json({
      eventId,
      checkinMode: event.checkinMode,
      maxEntries: event.maxEntries,
      checkinStartAt: event.checkinStartAt,
      checkinEndAt: event.checkinEndAt,
      tickets: syncTickets,
    });
  } catch (error) {
    console.error("Sync event error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}