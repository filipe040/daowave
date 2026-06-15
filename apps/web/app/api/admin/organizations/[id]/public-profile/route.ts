import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/guards";
import { z } from "zod";
import { createAuditLog } from "@/lib/audit";

const patchSchema = z.object({
  publicProfileEnabled: z.boolean().optional(),
  bannerUrl: z.string().url().optional().or(z.literal("")),
  logoUrl: z.string().url().optional().or(z.literal("")),
  publicBio: z.string().max(2000).optional().or(z.literal("")),
  publicProfileNote: z.string().max(2000).optional().or(z.literal("")),
});

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireAuth();
    if ((session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const org = await prisma.organization.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        slug: true,
        name: true,
        logoUrl: true,
        bannerUrl: true,
        publicBio: true,
        publicProfileEnabled: true,
        publicProfileEnabledAt: true,
        publicProfileNote: true,
      },
    });

    if (!org) {
      return NextResponse.json({ error: "Organização não encontrada" }, { status: 404 });
    }

    return NextResponse.json(org);
  } catch (error) {
    console.error("[Admin Public Profile GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await requireAuth();
    const userId = (session.user as { id?: string }).id;

    if ((session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = patchSchema.parse(await req.json());

    const existing = await prisma.organization.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        slug: true,
        publicProfileEnabled: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Organização não encontrada" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};

    if (body.bannerUrl !== undefined) data.bannerUrl = body.bannerUrl || null;
    if (body.logoUrl !== undefined) data.logoUrl = body.logoUrl || null;
    if (body.publicBio !== undefined) data.publicBio = body.publicBio || null;
    if (body.publicProfileNote !== undefined) data.publicProfileNote = body.publicProfileNote || null;

    if (body.publicProfileEnabled !== undefined) {
      data.publicProfileEnabled = body.publicProfileEnabled;
      if (body.publicProfileEnabled && !existing.publicProfileEnabled) {
        data.publicProfileEnabledAt = new Date();
      }
      if (!body.publicProfileEnabled) {
        data.publicProfileEnabledAt = null;
      }
    }

    const updated = await prisma.organization.update({
      where: { id: params.id },
      data,
      select: {
        id: true,
        slug: true,
        name: true,
        logoUrl: true,
        bannerUrl: true,
        publicBio: true,
        publicProfileEnabled: true,
        publicProfileEnabledAt: true,
        publicProfileNote: true,
      },
    });

    if (
      body.publicProfileEnabled !== undefined &&
      body.publicProfileEnabled !== existing.publicProfileEnabled
    ) {
      await createAuditLog({
        userId,
        action: body.publicProfileEnabled
          ? "org.public_profile_enabled"
          : "org.public_profile_disabled",
        entityType: "organization",
        entityId: updated.id,
        details: { slug: updated.slug },
        ip: req.headers.get("x-forwarded-for") || undefined,
        userAgent: req.headers.get("user-agent") || undefined,
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message, details: error.errors },
        { status: 400 }
      );
    }
    console.error("[Admin Public Profile PATCH]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
