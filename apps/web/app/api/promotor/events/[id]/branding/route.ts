/**
 * PATCH /api/promotor/events/[id]/branding
 * Update event branding & landing page (Protocolo Visual - Editor de Marca)
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function isValidHexColor(s: string | null | undefined): boolean {
  if (s == null || s === "") return true;
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(s);
}

function isValidUrl(s: string | null | undefined): boolean {
  if (s == null || s === "") return true;
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
}

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

    const body = await request.json().catch(() => ({}));
    
    // Branding fields (Editor de Marca)
    const primaryColor = typeof body.primaryColor === "string" ? body.primaryColor.trim() || null : undefined;
    const secondaryColor = typeof body.secondaryColor === "string" ? body.secondaryColor.trim() || null : undefined;
    const logoUrl = typeof body.logoUrl === "string" ? body.logoUrl.trim() || null : undefined;
    const bannerUrl = typeof body.bannerUrl === "string" ? body.bannerUrl.trim() || null : undefined;
    const fontFamily = typeof body.fontFamily === "string" ? body.fontFamily.trim() || null : undefined;
    
    // Landing Page fields
    const landingPageContent = typeof body.landingPageContent === "string" ? body.landingPageContent : undefined;
    const useCustomLandingPage = typeof body.useCustomLandingPage === "boolean" ? body.useCustomLandingPage : undefined;

    // Validation
    if (primaryColor != null && !isValidHexColor(primaryColor)) {
      return NextResponse.json({ error: "Cor primária inválida (use #hex)" }, { status: 400 });
    }
    if (secondaryColor != null && !isValidHexColor(secondaryColor)) {
      return NextResponse.json({ error: "Cor secundária inválida (use #hex)" }, { status: 400 });
    }
    if (logoUrl != null && !isValidUrl(logoUrl)) {
      return NextResponse.json({ error: "URL do logo inválida" }, { status: 400 });
    }
    if (bannerUrl != null && !isValidUrl(bannerUrl)) {
      return NextResponse.json({ error: "URL do banner inválida" }, { status: 400 });
    }

    const updateData: {
      primaryColor?: string | null;
      secondaryColor?: string | null;
      logoUrl?: string | null;
      bannerUrl?: string | null;
      fontFamily?: string | null;
      landingPageContent?: string | null;
      useCustomLandingPage?: boolean;
    } = {};
    
    if (primaryColor !== undefined) updateData.primaryColor = primaryColor;
    if (secondaryColor !== undefined) updateData.secondaryColor = secondaryColor;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (bannerUrl !== undefined) updateData.bannerUrl = bannerUrl;
    if (fontFamily !== undefined) updateData.fontFamily = fontFamily;
    if (landingPageContent !== undefined) updateData.landingPageContent = landingPageContent;
    if (useCustomLandingPage !== undefined) updateData.useCustomLandingPage = useCustomLandingPage;

    await prisma.event.update({
      where: { id: eventId },
      data: updateData,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[branding] PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
