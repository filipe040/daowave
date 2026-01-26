import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, getRequestMetadata, safeLog } from "@/lib/security";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Find the event
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organizer: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
    }

    // Only approve DRAFT events from organizers
    if (event.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Apenas eventos em rascunho podem ser aprovados" },
        { status: 400 }
      );
    }

    if (event.organizer.user.role !== "ORGANIZER") {
      return NextResponse.json(
        { error: "Apenas eventos de promotores precisam de aprovação" },
        { status: 400 }
      );
    }

    // Approve and publish the event
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        status: "PUBLISHED",
      },
    });

    // Audit log
    const metadata = getRequestMetadata(req);
    await createAuditLog({
      userId: session.user.id,
      action: "EVENT_PUBLISHED",
      resourceType: "event",
      resourceId: id,
      details: {
        eventTitle: event.title,
        organizerId: event.organizerId,
        previousStatus: "DRAFT",
        newStatus: "PUBLISHED",
      },
      ...metadata,
    });

    safeLog.info(`Event published: ${id}`, { eventId: id, adminId: session.user.id });

    return NextResponse.json(updatedEvent);
  } catch (error: any) {
    safeLog.error("Approve event error", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error.message || "Erro desconhecido",
        code: error.code,
      },
      { status: 500 }
    );
  }
}

