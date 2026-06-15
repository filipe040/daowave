import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import { join } from "path";
import { canManageEvents } from "@/lib/auth/member-permissions";
import { requirePromoterEventApi } from "@/lib/auth/promoter-api";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; assetId: string }> }
) {
  try {
    const { id: eventId, assetId } = await params;
    const access = await requirePromoterEventApi(eventId, { requirePermission: canManageEvents });
    if (access instanceof NextResponse) return access;

    const asset = await prisma.eventAsset.findFirst({
      where: { id: assetId, eventId },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    const filePath = join(process.cwd(), "public", asset.url);
    try {
      await unlink(filePath);
    } catch (err: unknown) {
      const code = (err as NodeJS.ErrnoException)?.code;
      if (code !== "ENOENT") {
        console.error("[assets-delete] unlink error:", err);
      }
    }

    await prisma.eventAsset.delete({ where: { id: assetId } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[assets-delete] DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
