/**
 * GET /api/promotor/events/[id]/tickets — List ticket lots for event (canonical).
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || ((session.user as { role?: string }).role !== "PROMOTER" && (session.user as { role?: string }).role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let organizerProfile: { id: string } | null = null;
  if ((session.user as { role?: string }).role === "PROMOTER") {
    const profile = await prisma.promoterProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) {
      return NextResponse.json({ error: "Promoter not found" }, { status: 404 });
    }
    organizerProfile = profile;
  }

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      ticketLots: {
        orderBy: { saleStartAt: "asc" },
      },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if ((session.user as { role?: string }).role !== "ADMIN" && organizerProfile && event.promoterId !== organizerProfile.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  return NextResponse.json({ ticketLots: event.ticketLots });
}
