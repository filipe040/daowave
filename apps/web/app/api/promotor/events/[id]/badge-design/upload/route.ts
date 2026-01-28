/**
 * POST /api/promotor/events/[id]/badge-design/upload
 * Upload badge template image
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
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

    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        promoterId: promoter.id,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Ficheiro não fornecido" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Ficheiro deve ser uma imagem" }, { status: 400 });
    }

    // Convert file to base64 or upload to storage
    // For now, we'll convert to base64 data URL (in production, use proper storage like S3)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    // In production, upload to S3/storage and return URL
    // For now, return data URL (not ideal for large files, but works for MVP)
    return NextResponse.json({
      url: dataUrl,
      filename: file.name,
    });
  } catch (error) {
    console.error("[badge-design] upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
