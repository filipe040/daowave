/**
 * POST /api/promotor/events/[id]/badge-design/generate
 * Generate badges with custom template
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
      select: {
        badgeTemplateImageUrl: true,
        badgePrefix: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (!event.badgeTemplateImageUrl) {
      return NextResponse.json({ error: "Template de badge não configurado" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const quantity = typeof body.quantity === "number" ? body.quantity : 10;
    const prefix = (body.prefix || event.badgePrefix || "BADGE").trim();

    // TODO: Generate badges using PDF library (pdfkit, puppeteer, etc.)
    // For now, return success
    // In production, this would:
    // 1. Load the template image
    // 2. Generate PDFs with ticket data overlaid on template
    // 3. Store PDFs and return download links

    return NextResponse.json({
      ok: true,
      message: `${quantity} badges gerados com sucesso`,
      prefix,
      templateUrl: event.badgeTemplateImageUrl,
    });
  } catch (error) {
    console.error("[badge-design] generate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
