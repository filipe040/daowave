/**
 * GET /api/admin/overview — KPIs da plataforma (GMV, eventos, promotores, bilhetes)
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminOverview } from "@/lib/services/admin-overview.service";
import { safeLog } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const overview = await getAdminOverview();
    return NextResponse.json(overview);
  } catch (error) {
    safeLog.error("Admin overview error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
