import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createAuditLog, getRequestMetadata, safeLog } from "@/lib/security";

const TicketTypeSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional().nullable(),
  basePrice: z.number().int().positive("Preço deve ser positivo"),
  currency: z.string().min(1, "Moeda é obrigatória"),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "PROMOTER" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

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
      where: { id },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Verify ownership (admins can access any event)
    if (session.user.role !== "ADMIN" && organizerProfile && event.promoterId !== organizerProfile.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const data = TicketTypeSchema.parse(body);

    // TODO: Add TicketType model to Prisma schema
    // const ticketType = await prisma.ticketType.create({
    //   data: {
    //     eventId: id,
    //     name: data.name,
    //     description: data.description || null,
    //     basePrice: data.basePrice,
    //     currency: data.currency,
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

    safeLog.error("Error creating ticket type", error);
    return NextResponse.json(
      { error: "Failed to create ticket type" },
      { status: 500 }
    );
  }
}

