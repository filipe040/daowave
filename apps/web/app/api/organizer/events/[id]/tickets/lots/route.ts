import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createAuditLog, getRequestMetadata, safeLog } from "@/lib/security";

const TicketLotSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  price: z.number().int().positive("Preço deve ser positivo"),
  startsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Formato de data inválido"),
  endsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Formato de data inválido"),
  stockTotal: z.number().int().positive("Quantidade deve ser positiva"),
}).refine((data) => {
  return new Date(data.endsAt) > new Date(data.startsAt);
}, {
  message: "Data de fim deve ser posterior à data de início",
  path: ["endsAt"],
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
    const data = TicketLotSchema.parse(body);

    // ticketType model doesn't exist in schema
    const ticketLot = await prisma.ticketLot.create({
      data: {
        eventId: id,
        name: data.name,
        priceCents: data.price,
        saleStartAt: new Date(data.startsAt),
        saleEndAt: new Date(data.endsAt),
        quantityTotal: data.stockTotal,
        quantitySold: 0,
      },
    });

    // Audit log for lot creation (price change)
    const metadata = getRequestMetadata(req);
    await createAuditLog({
      userId: session.user.id,
      action: "TICKET_LOT_CREATED",
      resourceType: "ticketLot",
      resourceId: ticketLot.id,
      details: {
        eventId: id,
        name: data.name,
        price: data.price,
        stockTotal: data.stockTotal,
      },
      ...metadata,
    });

    safeLog.info(`Ticket lot created: ${ticketLot.id}`, { ticketLotId: ticketLot.id, eventId: id });

    return NextResponse.json({ ticketLot }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    safeLog.error("Error creating ticket lot", error);
    return NextResponse.json(
      { error: "Failed to create ticket lot" },
      { status: 500 }
    );
  }
}

