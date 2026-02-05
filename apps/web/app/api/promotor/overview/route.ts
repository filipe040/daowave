/**
 * GET /api/promotor/overview — KPIs do dashboard promotor
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPromoterOverview } from "@/lib/services/promoter-overview.service";
import { safeLog } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as { role?: string }).role;
    if (role !== "PROMOTER" && role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const promoter = await prisma.promoterProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!promoter || promoter.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Promoter profile not found or not approved" },
        { status: 403 }
      );
    }

    const overview = await getPromoterOverview(promoter.id);
    return NextResponse.json(overview);
  } catch (error) {
    safeLog.error("Promoter overview error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
