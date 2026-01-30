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

    const organizerProfile = await prisma.promoterProfile.findUnique({
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
    if (event.promoterId !== organizerProfile.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Organizers cannot publish directly - events need admin approval
    if (session.user.role === "PROMOTER") {
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
    if (!event.venue) errors.push("Nome do local é obrigatório");
    if (!event.city) errors.push("Cidade é obrigatória");
    // Banner: form saves to bannerUrl; legacy field is coverImage
    const hasBanner = !!(event.coverImage?.trim() || (event as { bannerUrl?: string | null }).bannerUrl?.trim());
    if (!hasBanner) errors.push("Imagem de banner é obrigatória para publicar");

    // Validate dates (allow 5 min grace for clock skew; admins can publish past events)
    const now = Date.now();
    const startMs = new Date(event.startAt).getTime();
    const endMs = new Date(event.endAt).getTime();
    if (endMs <= startMs) {
      errors.push("Data de fim deve ser posterior à data de início");
    }
    const isAdmin = session.user.role === "ADMIN";
    if (!isAdmin && startMs < now - 5 * 60 * 1000) {
      errors.push("Data de início não pode estar no passado");
    }

    // checkinMode and maxEntries fields don't exist in Event model

    // reentryAllowed and checkinMode fields don't exist in Event model

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

