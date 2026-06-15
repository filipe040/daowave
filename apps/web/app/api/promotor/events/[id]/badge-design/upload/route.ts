/**
 * POST /api/promotor/events/[id]/badge-design/upload
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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Ficheiro não fornecido" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Ficheiro deve ser uma imagem" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    return NextResponse.json({
      url: dataUrl,
      filename: file.name,
    });
  } catch (error) {
    console.error("[badge-design] upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
