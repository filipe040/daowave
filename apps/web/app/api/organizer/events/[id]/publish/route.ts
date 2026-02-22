import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, getRequestMetadata, safeLog } from "@/lib/security";
import { EventService } from "@/lib/services/event.service";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await props.params;

    const organizerProfile = await prisma.promoterProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!organizerProfile && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Organizer profile not found" },
        { status: 403 }
      );
    }

    const event = await EventService.getById(id, {
      promoterId: organizerProfile?.id,
      isAdmin: session.user.role === "ADMIN",
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (session.user.role === "PROMOTER" && (!organizerProfile || organizerProfile.status !== "APPROVED")) {
      return NextResponse.json(
        { error: "Apenas promotores aprovados podem publicar eventos." },
        { status: 403 }
      );
    }

    const validation = EventService.validatePublish(event, {
      isAdmin: session.user.role === "ADMIN",
    });
    if (!validation.ok) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    const previousStatus = event.status;
    const updatedEvent = await EventService.publish(id);

    const metadata = getRequestMetadata(req);
    await createAuditLog({
      userId: session.user.id,
      action: "EVENT_PUBLISHED",
      entityType: "event",
      entityId: id,
      details: {
        eventTitle: event.title,
        previousStatus,
        newStatus: "PUBLISHED",
        promoterId: event.promoterId,
      },
      ...metadata,
    });

    safeLog.info(`Event published (legacy): ${id}`, { eventId: id, promoterId: event.promoterId });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    safeLog.error("Publish event error (legacy)", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
