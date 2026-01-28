import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

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

    // Verify event ownership (admins can upload to any event)
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        ...(userRole !== "ADMIN" ? { promoterId: promoter.id } : {}),
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

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de ficheiro não permitido. Apenas PNG, JPG, WEBP" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Ficheiro muito grande (máximo 10MB)" },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", "events", eventId);
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error: any) {
      if (error.code !== "EEXIST") {
        throw error;
      }
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${timestamp}-${sanitizedFilename}`;
    const filePath = join(uploadsDir, filename);

    // Save file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Create database record
    const url = `/uploads/events/${eventId}/${filename}`;

    try {
      const asset = await prisma.eventAsset.create({
        data: {
          eventId,
          filename: file.name,
          url,
          mimeType: file.type,
          size: file.size,
        },
      });

      return NextResponse.json({ asset }, { status: 201 });
    } catch (error: any) {
      // If table doesn't exist (migration not applied), return error
      if (error?.code === "P2021" || error?.message?.includes("does not exist")) {
        return NextResponse.json(
          { error: "Funcionalidade de assets não disponível. Por favor, execute a migração do Prisma." },
          { status: 503 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("[assets-upload] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
