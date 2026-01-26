import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createAuditLog, getRequestMetadata, safeLog } from "@/lib/security";

const UpdateTicketLotSchema = z.object({
  name: z.string().min(1).optional(),
  price: z.number().int().positive().optional(),
  startsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/).optional(),
  endsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/).optional(),
  stockTotal: z.number().int().positive().optional(),
});

/**
 * PUT /api/organizer/events/[id]/tickets/lots/[lotId]
 * Update ticket lot (price changes are audited)
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; lotId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "PROMOTER" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: eventId, lotId } = await params;

  try {
    // For admins, skip organizer profile check
    let organizerProfile = null;
    if (session.user.role === "PROMOTER") {
      organizerProfile = await prisma.promoterProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!organizerProfile || organizerProfile.status !== "APPROVED") {
        return NextResponse.json(
          { error: "Organizer not approved" },
          { status: 403 }
        );
      }
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Verify ownership (admins can access any event)
    if (session.user.role !== "ADMIN" && organizerProfile && event.promoterId !== organizerProfile.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get current ticket lot
    const currentLot = await prisma.ticketLot.findFirst({
      where: {
        id: lotId,
        eventId: eventId,
      },
    });

    if (!currentLot) {
      return NextResponse.json({ error: "Ticket lot not found" }, { status: 404 });
    }

    const body = await req.json();
    const data = UpdateTicketLotSchema.parse(body);

    // Update ticket lot
    const updatedLot = await prisma.ticketLot.update({
      where: { id: lotId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.price !== undefined && { priceCents: data.price }),
        ...(data.startsAt && { startsAt: new Date(data.startsAt) }),
        ...(data.endsAt && { endsAt: new Date(data.endsAt) }),
        ...(data.stockTotal !== undefined && { quantityTotal: data.stockTotal }),
      },
    });

    // Audit log if price changed
    if (data.price !== undefined && data.price !== currentLot.priceCents) {
      const metadata = getRequestMetadata(req);
      await createAuditLog({
        userId: session.user.id,
        action: "TICKET_LOT_PRICE_CHANGED",
        resourceType: "ticketLot",
        resourceId: lotId,
        details: {
          eventId: eventId,
          lotName: currentLot.name,
          previousPrice: currentLot.priceCents,
          newPrice: data.price,
        },
        ...metadata,
      });

      safeLog.info(`Ticket lot price changed: ${lotId}`, {
        lotId,
        previousPrice: currentLot.priceCents,
        newPrice: data.price,
      });
    }

    return NextResponse.json({ ticketLot: updatedLot });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    safeLog.error("Error updating ticket lot", error);
    return NextResponse.json(
      { error: "Failed to update ticket lot" },
      { status: 500 }
    );
  }
}

