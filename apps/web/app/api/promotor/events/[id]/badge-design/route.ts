/**
 * GET /api/promotor/events/[id]/badge-design
 * PATCH /api/promotor/events/[id]/badge-design
 */

import { NextResponse } from "next/server";
import { canManageBrandingSettings } from "@/lib/auth/member-permissions";
import { requirePromoterEventApi } from "@/lib/auth/promoter-api";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const access = await requirePromoterEventApi(eventId);
    if (access instanceof NextResponse) return access;

    return NextResponse.json({
      templateImageUrl: null,
      prefix: null,
    });
  } catch (error) {
    console.error("[badge-design] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const access = await requirePromoterEventApi(eventId, {
      requirePermission: canManageBrandingSettings,
    });
    if (access instanceof NextResponse) return access;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[badge-design] PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
