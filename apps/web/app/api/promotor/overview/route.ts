import { NextResponse } from "next/server";
import { getPromoterOverview } from "@/lib/services/promoter-overview.service";
import { safeLog } from "@/lib/security";
import { requirePromoter } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { orgId } = await requirePromoter();

    // If the user belongs to an organization, we show the organization overview.
    const overview = await getPromoterOverview({
      organizationId: orgId || undefined
    });

    return NextResponse.json(overview);
  } catch (error) {
    safeLog.error("Promoter overview error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
