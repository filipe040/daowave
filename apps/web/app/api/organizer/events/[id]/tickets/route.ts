import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "PROMOTER" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // For admins, skip organizer profile check
  let organizerProfile = null;
  if (session.user.role === "PROMOTER") {
    organizerProfile = await prisma.promoterProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!organizerProfile) {
      return NextResponse.json({ error: "Organizer not found" }, { status: 404 });
    }
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

  // Verify ownership (admins can access any event)
  if (session.user.role !== "ADMIN" && organizerProfile && event.promoterId !== organizerProfile.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  return NextResponse.json({ ticketLots: event.ticketLots });
}

