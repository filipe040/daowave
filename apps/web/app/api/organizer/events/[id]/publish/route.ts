import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, getRequestMetadata, safeLog } from "@/lib/security";

// POST /api/organizer/events/[id]/publish - Publish event
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

    const organizerProfile = await prisma.organizerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!organizerProfile || organizerProfile.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Organizer profile not approved" },
        { status: 403 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Verify ownership
    if (event.organizerId !== organizerProfile.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Organizers cannot publish directly - events need admin approval
    if (session.user.role === "ORGANIZER") {
      return NextResponse.json(
        { 
          error: "Os eventos criados por promotores precisam de aprovação de um administrador antes de serem publicados. O seu evento foi enviado para revisão.",
          details: ["O evento permanecerá como rascunho até ser aprovado por um administrador."]
        },
        { status: 403 }
      );
    }

    // Validation checks for publishing
    const errors: string[] = [];

    if (!event.title) errors.push("Título é obrigatório");
    if (!event.description) errors.push("Descrição é obrigatória");
    if (!event.venueName) errors.push("Nome do local é obrigatório");
    if (!event.address) errors.push("Endereço é obrigatório");
    if (!event.city) errors.push("Cidade é obrigatória");
    if (!event.contactEmail) errors.push("Email de contacto é obrigatório");
    if (!event.bannerUrl) errors.push("Imagem de banner é obrigatória para publicar");
    if (!event.consentRGPD) errors.push("Consentimento RGPD é obrigatório");

    // Validate dates
    if (event.endAt <= event.startAt) {
      errors.push("Data de fim deve ser posterior à data de início");
    }

    if (event.startAt < new Date()) {
      errors.push("Data de início não pode estar no passado");
    }

    // Validate check-in configuration
    if (event.checkinMode === "MULTI" && !event.maxEntries) {
      errors.push("maxEntries é obrigatório para modo MULTI");
    }

    if (!event.reentryAllowed && event.checkinMode === "MULTI") {
      errors.push("Modo MULTI requer reentryAllowed=true");
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    // Publish event
    const previousStatus = event.status;
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        status: "PUBLISHED",
      } as any,
    });

    // Audit log
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
        organizerId: event.organizerId,
        note: "Requires admin approval",
      },
      ...metadata,
    });

    safeLog.info(`Event publish requested: ${id}`, { eventId: id, organizerId: event.organizerId });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    safeLog.error("Publish event error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

