/**
 * POST /api/promotor/events/[id]/tickets/types — Create ticket type (canonical).
 * Note: TicketType model not in schema; returns 501 until added.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { safeLog } from "@/lib/security";

const TicketTypeSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional().nullable(),
  basePrice: z.number().int().positive("Preço deve ser positivo"),
  currency: z.string().min(1, "Moeda é obrigatória"),
});

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || ((session.user as { role?: string }).role !== "PROMOTER" && (session.user as { role?: string }).role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    let organizerProfile: { id: string } | null = null;
    if ((session.user as { role?: string }).role === "PROMOTER") {
      const profile = await prisma.promoterProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!profile || profile.status !== "APPROVED") {
        return NextResponse.json(
          { error: "Promoter not approved" },
          { status: 403 }
        );
      }
      organizerProfile = profile;
    }

    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if ((session.user as { role?: string }).role !== "ADMIN" && organizerProfile && event.promoterId !== organizerProfile.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const data = TicketTypeSchema.parse(body);

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
