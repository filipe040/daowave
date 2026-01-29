#!/usr/bin/env node
/**
 * One-time fix: overwrite the 5 API route files with clean versions
 * (no duplicate imports, no TsConstAssertion). Run from repo root:
 *   node scripts/fix-api-routes-vps.js
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const WEB = path.join(ROOT, "apps", "web", "app", "api");

const files = {
  "health/route.ts": `import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Health check endpoint
 * Lightweight checks: DB + optional services via dynamic imports
 */
export async function GET() {
  // Dynamic import to avoid heavy init at build time
  const { config } = await import("@/lib/config").catch(() => ({ config: { env: { name: "unknown" }, storage: { enabled: false }, email: { enabled: false }, payments: { stripe: { enabled: false }, mock: { enabled: false } } } }));

  const checks: any = {
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: config?.env?.name ?? "unknown",
    services: {
      database: { status: "unknown", latency: 0 },
      storage: { status: config?.storage?.enabled ? "enabled" : "disabled" },
      email: { status: config?.email?.enabled ? "enabled" : "disabled" },
      payments: { stripe: config?.payments?.stripe?.enabled ?? false, mock: config?.payments?.mock?.enabled ?? false },
      redis: { status: process.env.REDIS_URL ? "enabled" : "disabled", enabled: Boolean(process.env.REDIS_URL) },
    },
  };

  try {
    const start = Date.now();
    await prisma.$queryRaw\`SELECT 1\`;
    checks.services.database = { status: "ok", latency: Date.now() - start };
  } catch (e) {
    console.error("[health] DB error:", e);
    checks.services.database = { status: "error", latency: 0 };
    checks.status = "degraded";
  }

  const statusCode = checks.status === "ok" ? 200 : 503;
  return NextResponse.json(checks, { status: statusCode });
}
`,
  "promotor/events/[id]/archive/route.ts": `import { NextResponse } from "next/server";
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

    if (!promoter && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Promoter profile not found" }, { status: 404 });
    }

    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        ...(userRole !== "ADMIN" ? { promoterId: promoter!.id } : {}),
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const archive = body.archive === true;

    await prisma.event.update({
      where: { id: eventId },
      data: { archivedAt: archive ? new Date() : null },
    });

    return NextResponse.json({
      archivedAt: archive ? new Date().toISOString() : null,
    });
  } catch (error) {
    console.error("[archive] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
`,
  "promotor/events/[id]/assets/[assetId]/route.ts": `import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import { join } from "path";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
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

    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        ...(userRole !== "ADMIN" ? { promoterId: promoter!.id } : {}),
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const asset = await prisma.eventAsset.findFirst({
      where: { id: assetId, eventId },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Delete file from disk (url is e.g. /uploads/events/eventId/filename)
    const filePath = join(process.cwd(), "public", asset.url);
    try {
      await unlink(filePath);
    } catch (err: unknown) {
      const code = (err as NodeJS.ErrnoException)?.code;
      if (code !== "ENOENT") {
        console.error("[assets-delete] unlink error:", err);
      }
    }

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
`,
  "promotor/events/[id]/assets/upload/route.ts": `import { NextResponse } from "next/server";
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

    if (!promoter && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Promoter profile not found" }, { status: 404 });
    }

    // Verify event ownership (admins can upload to any event)
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        ...(userRole !== "ADMIN" ? { promoterId: promoter!.id } : {}),
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
    const filename = \`\${timestamp}-\${sanitizedFilename}\`;
    const filePath = join(uploadsDir, filename);

    // Save file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Create database record
    const url = \`/uploads/events/\${eventId}/\${filename}\`;

    try {
      const asset = await prisma.eventAsset.create({
        data: {
          eventId,
          filename: file.name,
          name: file.name,
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
`,
  "promotor/events/[id]/settings/route.ts": `import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const UpdateEventSettingsSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug inválido (apenas letras minúsculas, números e hífens)"),
  description: z.string().min(1, "Descrição é obrigatória"),
  venue: z.string().min(1, "Local é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  coverImage: z.string().url().nullable().optional(),
}).refine((data) => {
  return new Date(data.endAt) > new Date(data.startAt);
}, {
  message: "Data de fim deve ser posterior à data de início",
  path: ["endAt"],
});

export async function PATCH(
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

    if (!promoter && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Promoter profile not found" }, { status: 404 });
    }

    // Verify event ownership (admins can edit any event)
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        ...(userRole !== "ADMIN" ? { promoterId: promoter!.id } : {}),
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const data = UpdateEventSettingsSchema.parse(body);

    // Check slug uniqueness (if changed)
    if (data.slug !== event.slug) {
      const slugExists = await prisma.event.findUnique({
        where: { slug: data.slug },
      });

      if (slugExists) {
        return NextResponse.json(
          { error: "Já existe um evento com este slug" },
          { status: 400 }
        );
      }
    }

    // Update event
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        title: data.title,
        slug: data.slug,
        description: data.description,
        venue: data.venue,
        city: data.city,
        startAt: new Date(data.startAt),
        endAt: new Date(data.endAt),
        coverImage: data.coverImage || null,
      },
    });

    return NextResponse.json({ event: updatedEvent });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("[event-settings] PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
`,
};

for (const [relPath, content] of Object.entries(files)) {
  const fullPath = path.join(WEB, relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(fullPath, content, "utf8");
  console.log("Written:", fullPath);
}

console.log("Done. Run: npm --workspace apps/web run build");
