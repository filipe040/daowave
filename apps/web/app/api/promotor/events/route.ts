/**
 * GET /api/promotor/events — List events for current promoter (canonical).
 * POST /api/promotor/events — Create new event (canonical).
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { safeLog } from "@/lib/security";
import { EventService } from "@/lib/services/event.service";

export const dynamic = "force-dynamic";

const CreateEventSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug inválido"),
  description: z.string().min(1, "Descrição é obrigatória"),
  venueName: z.string().min(1, "Nome do local é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  startAt: z.string().refine((val) => val !== "" && !isNaN(Date.parse(val)), { message: "Data de início inválida" }),
  endAt: z.string().refine((val) => val !== "" && !isNaN(Date.parse(val)), { message: "Data de fim inválida" }),
  checkinMode: z.enum(["SINGLE", "MULTI"]).default("SINGLE"),
  maxEntries: z.number().int().positive().optional().nullable(),
  entryWindowStartAt: z.union([z.string(), z.null()]).optional().nullable(),
  entryWindowEndAt: z.union([z.string(), z.null()]).optional().nullable(),
  bannerUrl: z.string().optional().nullable(),
  galleryUrls: z.array(z.string()).optional().nullable(),
});

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if ((session.user as { role?: string }).role !== "PROMOTER" && (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const promoter = await prisma.promoterProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!promoter || promoter.status !== "APPROVED") {
      return NextResponse.json({ error: "Promoter profile not approved" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const selectAll = searchParams.get("select") === "all";
    const result = await EventService.listByPromoter(promoter.id, { selectAll });
    return NextResponse.json(result);
  } catch (error) {
    safeLog.error("Get promoter events error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== "PROMOTER" && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const promoter = await prisma.promoterProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!promoter || promoter.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Promoter profile not approved" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const data = CreateEventSchema.parse(body);

    const startAt = new Date(data.startAt);
    const endAt = new Date(data.endAt);
    if (endAt <= startAt) {
      return NextResponse.json(
        { error: "Data de fim deve ser posterior à data de início" },
        { status: 400 }
      );
    }

    if (data.checkinMode === "MULTI" && !data.maxEntries) {
      return NextResponse.json(
        { error: "maxEntries é obrigatório para modo MULTI" },
        { status: 400 }
      );
    }

    if (await EventService.isSlugTaken(data.slug)) {
      return NextResponse.json(
        { error: "Já existe um evento com este slug" },
        { status: 400 }
      );
    }

    const bannerUrl = (() => {
      let url = data.bannerUrl;
      if (url?.includes("imgur.com")) {
        if (!url.startsWith("http")) {
          const match = url.match(/imgur\.com\/([a-zA-Z0-9]+)/);
          if (match && !url.includes("/a/")) url = `https://i.imgur.com/${match[1]}.jpg`;
          else url = `https://${url}`;
        }
      }
      return url ?? null;
    })();

    const event = await EventService.create({
      promoterId: promoter.id,
      title: data.title,
      slug: data.slug,
      description: data.description,
      venue: data.venueName,
      city: data.city,
      startAt,
      endAt,
      bannerUrl,
      checkinMode: data.checkinMode,
      maxEntries: data.maxEntries ?? null,
      checkinStartAt: data.entryWindowStartAt ? new Date(data.entryWindowStartAt) : null,
      checkinEndAt: data.entryWindowEndAt ? new Date(data.entryWindowEndAt) : null,
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    safeLog.error("Create event error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
