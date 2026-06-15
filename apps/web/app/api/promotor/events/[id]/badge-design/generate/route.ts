/**
 * POST /api/promotor/events/[id]/badge-design/generate
 */

import { NextResponse } from "next/server";
import { canManageBrandingSettings } from "@/lib/auth/member-permissions";
import { requirePromoterEventApi } from "@/lib/auth/promoter-api";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const access = await requirePromoterEventApi(eventId, {
      requirePermission: canManageBrandingSettings,
    });
    if (access instanceof NextResponse) return access;

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
