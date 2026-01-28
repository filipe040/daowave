import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const ArchiveEventSchema = z.object({
  archive: z.boolean(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as { role?: string })?.role;
    if (userRole !== "PROMOTER" && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: eventId } = await params;
    const promoter = await prisma.promoterProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!promoter) {
      return NextResponse.json({ error: "Promoter profile not found" }, { status: 404 });
    }

    // Verify event ownership (admins can archive any event)
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        ...(userRole !== "ADMIN" ? { promoterId: promoter.id } : {}),
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const data = ArchiveEventSchema.parse(body);

    // Only allow archiving if event is PUBLISHED
    if (data.archive && event.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "Apenas eventos publicados podem ser arquivados" },
        { status: 400 }
      );
    }

    // Update archivedAt
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        archivedAt: data.archive ? new Date() : null,
      },
    });

    return NextResponse.json({
      event: updatedEvent,
      message: data.archive ? "Evento arquivado com sucesso" : "Evento re-publicado com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("[event-archive] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
