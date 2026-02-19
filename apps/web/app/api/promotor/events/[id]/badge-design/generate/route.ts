/**
 * POST /api/promotor/events/[id]/badge-design/generate
 * Generate badges with custom template
 */

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

    if (!promoter) {
      return NextResponse.json({ error: "Promoter profile not found" }, { status: 404 });
    }

    // Badge design fields not yet in schema
    const body = await request.json().catch(() => ({}));
    const quantity = typeof body.quantity === "number" ? body.quantity : 10;
    const prefix = (body.prefix || "BADGE").trim();

    return NextResponse.json({
      ok: true,
      message: `${quantity} badges gerados (Simulação - Schema pendente)`,
      prefix,
      templateUrl: null,
    });
  } catch (error) {
    console.error("[badge-design] generate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
