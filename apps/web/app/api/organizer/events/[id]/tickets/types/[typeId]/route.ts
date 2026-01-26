import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createAuditLog, getRequestMetadata, safeLog } from "@/lib/security";

const UpdateTicketTypeSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  basePrice: z.number().int().positive().optional(),
  currency: z.string().min(1).optional(),
});

/**
 * PUT /api/organizer/events/[id]/tickets/types/[typeId]
 * Update ticket type (price changes are audited)
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; typeId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "PROMOTER" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: eventId, typeId } = await params;

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

    // TODO: Add TicketType model to Prisma schema
    // Get current ticket type
    // const currentType = await prisma.ticketType.findFirst({
    //   where: {
    //     id: typeId,
    //     eventId: eventId,
    //   },
    // });

    // if (!currentType) {
    //   return NextResponse.json({ error: "Ticket type not found" }, { status: 404 });
    // }

    // const body = await req.json();
    // const data = UpdateTicketTypeSchema.parse(body);

    // Update ticket type
    // const updatedType = await prisma.ticketType.update({
    //   where: { id: typeId },
    //   data: {
    //     ...(data.name && { name: data.name }),
    //     ...(data.description !== undefined && { description: data.description }),
    //     ...(data.basePrice !== undefined && { basePrice: data.basePrice }),
    //     ...(data.currency && { currency: data.currency }),
    //   },
    // });

    return NextResponse.json(
      { error: "TicketType functionality not available. Model not in schema." },
      { status: 501 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    safeLog.error("Error updating ticket type", error);
    return NextResponse.json(
      { error: "Failed to update ticket type" },
      { status: 500 }
    );
  }
}

