import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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

    if (!promoter && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Promoter profile not found" }, { status: 404 });
    }

    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        ...(userRole !== "ADMIN" ? { promoterId: promoter!.id } : {}),
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const archive = body.archive === true;

    await prisma.event.update({
      where: { id: eventId },
      data: { archivedAt: archive ? new Date() : null },
    });

    return NextResponse.json({
      archivedAt: archive ? new Date().toISOString() : null,
    });
  } catch (error) {
    console.error("[archive] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
