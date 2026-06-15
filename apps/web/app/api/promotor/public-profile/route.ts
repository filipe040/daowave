import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
  apiForbidden,
  isPromoterApiContext,
  requirePromoterApiContext,
} from "@/lib/auth/promoter-api";
import { canManageBrandingSettings } from "@/lib/auth/member-permissions";

const patchSchema = z.object({
  bannerUrl: z.string().url().optional().or(z.literal("")),
  logoUrl: z.string().url().optional().or(z.literal("")),
  publicBio: z.string().max(2000).optional().or(z.literal("")),
});

export async function GET() {
  try {
    const ctx = await requirePromoterApiContext();
    if (!isPromoterApiContext(ctx)) return ctx;

    const org = await prisma.organization.findUnique({
      where: { id: ctx.orgId },
      select: {
        slug: true,
        name: true,
        logoUrl: true,
        bannerUrl: true,
        publicBio: true,
        publicProfileEnabled: true,
        website: true,
      },
    });

    if (!org) {
      return NextResponse.json({ error: "Organização não encontrada" }, { status: 404 });
    }

    return NextResponse.json(org);
  } catch (error) {
    console.error("[Promoter Public Profile GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await requirePromoterApiContext();
    if (!isPromoterApiContext(ctx)) return ctx;

    if (!canManageBrandingSettings(ctx.role) && ctx.globalRole !== "ADMIN") {
      return apiForbidden("Sem permissão para editar o perfil público");
    }

    const org = await prisma.organization.findUnique({
      where: { id: ctx.orgId },
      select: { publicProfileEnabled: true },
    });

    if (!org?.publicProfileEnabled) {
      return apiForbidden(
        "O perfil público não está ativo. Contacte o administrador da plataforma."
      );
    }

    const body = patchSchema.parse(await req.json());

    const updated = await prisma.organization.update({
      where: { id: ctx.orgId },
      data: {
        ...(body.bannerUrl !== undefined ? { bannerUrl: body.bannerUrl || null } : {}),
        ...(body.logoUrl !== undefined ? { logoUrl: body.logoUrl || null } : {}),
        ...(body.publicBio !== undefined ? { publicBio: body.publicBio || null } : {}),
      },
      select: {
        slug: true,
        name: true,
        logoUrl: true,
        bannerUrl: true,
        publicBio: true,
        publicProfileEnabled: true,
        website: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("[Promoter Public Profile PATCH]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
