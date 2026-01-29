import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export async function DELETE(request: Request, { params }: { params: { id: string; assetId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: eventId, assetId } = params;
  try {
    const promoter = await prisma.promoterProfile.findUnique({ where: { userId: session.user.id } });
    const ev = await prisma.event.findUnique({ where: { id: eventId }, select: { promoterId: true } });
    if (!ev) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    if ((session.user as any).role !== "ADMIN" && promoter?.id !== ev.promoterId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const asset = await prisma.eventAsset.findUnique({ where: { id: assetId } });
    if (!asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 });

    // delete file from disk
    const filepath = path.join(process.cwd(), "public", asset.url.replace(/^\//, ""));
    try {
      await fs.promises.unlink(filepath);
    } catch (e) {
      // ignore
    }

    await prisma.eventAsset.delete({ where: { id: assetId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[assets/delete] error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import { join } from "path";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; assetId: string }> }
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

    const { id: eventId, assetId } = await params;
    const promoter = await prisma.promoterProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!promoter && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Promoter profile not found" }, { status: 404 });
    }

    // Verify event ownership (admins can delete from any event)
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        ...(userRole !== "ADMIN" ? { promoterId: promoter!.id } : {}),
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Find asset
    let asset;
    try {
      asset = await prisma.eventAsset.findFirst({
        where: {
          id: assetId,
          eventId,
        },
      });
    } catch (error: any) {
      // Table doesn't exist (migration not applied)
      if (error?.code === "P2021" || error?.message?.includes("does not exist")) {
        return NextResponse.json(
          { error: "Funcionalidade de assets não disponível. Por favor, execute a migração do Prisma." },
          { status: 503 }
        );
      }
      throw error;
    }

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Delete file from disk
    try {
      const filePath = join(process.cwd(), "public", asset.url.replace(/^\//, ""));
      await unlink(filePath);
    } catch (error: any) {
      // File doesn't exist, continue anyway
      if (error.code !== "ENOENT") {
        console.warn("[assets-delete] Failed to delete file:", error);
      }
    }

    // Delete database record
    await prisma.eventAsset.delete({
      where: { id: assetId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[assets-delete] DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
