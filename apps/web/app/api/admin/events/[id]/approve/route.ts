import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, getRequestMetadata, safeLog } from "@/lib/security";
import { MarketingService } from "@/lib/services/marketing";

export const dynamic = "force-dynamic";

async function handleApprove(
  req: NextRequest,
  params: { id: string }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Find the event
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        promoter: {
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
      entityType: "event",
      entityId: id,
      details: {
        eventTitle: event.title,
        promoterId: event.promoterId,
        previousStatus: "DRAFT",
        newStatus: "PUBLISHED",
      },
      ...metadata,
    });

    // Fire & forget automated marketing email
    MarketingService.dispatchNewEventCampaign(id).catch(e => console.error(e));

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

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return handleApprove(req, { id });
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return handleApprove(req, { id });
}
