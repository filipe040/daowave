/**
 * POST /api/promotor/events/[id]/publish — Publish event (canonical).
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { createAuditLog, getRequestMetadata, safeLog } from "@/lib/security";
import { EventService } from "@/lib/services/event.service";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const organizerProfile = await prisma.promoterProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!organizerProfile || organizerProfile.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Promoter profile not approved" },
        { status: 403 }
      );
    }

    const event = await EventService.getById(id, {
      promoterId: organizerProfile.id,
      isAdmin: (session.user as { role?: string }).role === "ADMIN",
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if ((session.user as { role?: string }).role === "PROMOTER") {
      return NextResponse.json(
        {
          error: "Os eventos criados por promotores precisam de aprovação de um administrador antes de serem publicados. O seu evento foi enviado para revisão.",
          details: ["O evento permanecerá como rascunho até ser aprovado por um administrador."],
        },
        { status: 403 }
      );
    }

    const validation = EventService.validatePublish(event, {
      isAdmin: (session.user as { role?: string }).role === "ADMIN",
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
      action: "EVENT_PUBLISH_REQUESTED",
      resourceType: "event",
      resourceId: id,
      details: {
        eventTitle: event.title,
        previousStatus,
        newStatus: "PUBLISHED",
        promoterId: event.promoterId,
        note: "Requires admin approval",
      },
      ...metadata,
    });

    safeLog.info(`Event publish requested: ${id}`, { eventId: id, promoterId: event.promoterId });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    safeLog.error("Publish event error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
