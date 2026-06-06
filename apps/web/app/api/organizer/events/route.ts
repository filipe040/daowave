/**
 * @deprecated Use /api/promotor/events (canonical). This route is kept as legacy alias.
 * GET /api/organizer/events - List events for current organizer
 * POST /api/organizer/events - Create new event
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { safeLog } from "@/lib/security";
import { EventService } from "@/lib/services/event.service";

// GET /api/organizer/events - List events for current organizer
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const selectAll = searchParams.get("select") === "all";
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "PROMOTER" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const organizerProfile = await prisma.promoterProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!organizerProfile || organizerProfile.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Organizer profile not approved" },
        { status: 403 }
      );
    }

    const result = await EventService.listByPromoter(organizerProfile.id, { selectAll });
    return NextResponse.json(result);
  } catch (error) {
    safeLog.error("Get organizer events error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/organizer/events - Create new event
const CreateEventSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug inválido (apenas letras minúsculas, números e hífens)"),
  description: z.string().min(1, "Descrição é obrigatória"),
  category: z.string().optional(),
  venueName: z.string().min(1, "Nome do local é obrigatório"),
  address: z.string().min(1, "Endereço é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  startAt: z.string().refine((val) => val !== "" && !isNaN(Date.parse(val)), { message: "Data de início inválida" }),
  endAt: z.string().refine((val) => val !== "" && !isNaN(Date.parse(val)), { message: "Data de fim inválida" }),
  timezone: z.string().default("Europe/Lisbon"),
  
  // Check-in
  checkinMode: z.enum(["SINGLE", "MULTI"]).default("SINGLE"),
  maxEntries: z.number().int().positive().optional(),
  entryWindowStartAt: z.union([
    z.string().refine((val) => val === "" || val == null || !isNaN(Date.parse(val)), { message: "Data inválida" }),
    z.null(),
  ]).optional().nullable().transform((val) => (val === "" || val == null ? null : val)),
  entryWindowEndAt: z.union([
    z.string().refine((val) => val === "" || val == null || !isNaN(Date.parse(val)), { message: "Data inválida" }),
    z.null(),
  ]).optional().nullable().transform((val) => (val === "" || val == null ? null : val)),
  
  // Capacity
  capacityTotal: z.number().int().positive().optional().nullable(),
  
  // Policies
  ageRestriction: z.number().int().min(0).optional().nullable(),
  refundPolicy: z.string().optional().nullable(),
  cancellationPolicy: z.string().optional().nullable(),
  termsText: z.string().optional().nullable(),
  consentRGPD: z.boolean().default(false),
  
  // Accessibility
  wheelchairAccess: z.boolean().default(false),
  signLanguageSupport: z.boolean().default(false),
  accessibleWC: z.boolean().default(false),
  accessibilityNotes: z.string().optional().nullable(),
  
  // Contact
  contactEmail: z.string().email("Email inválido"),
  contactPhone: z.string().optional().nullable(),
  supportInstructions: z.string().optional().nullable(),
  
  // Media
  bannerUrl: z.string().refine((val) => {
    if (!val) return true; // nullable
    // Accept imgur.com links (with or without protocol, direct image links)
    if (val.includes("imgur.com")) {
      return true;
    }
    if (val.startsWith("/")) return true;
    // For other URLs, validate as normal URL
    try {
      new URL(val.startsWith("http") ? val : `https://${val}`);
      return true;
    } catch {
      return false;
    }
  }, { message: "URL inválida" }).optional().nullable(),
  galleryUrls: z.array(z.string().refine((val) => {
    if (val.includes("imgur.com")) return true;
    try {
      new URL(val.startsWith("http") ? val : `https://${val}`);
      return true;
    } catch {
      return false;
    }
  }, { message: "URL inválida" })).optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "PROMOTER" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const organizerProfile = await prisma.promoterProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!organizerProfile || organizerProfile.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Organizer profile not approved" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const data = CreateEventSchema.parse(body);

    // Validate dates
    const startAt = new Date(data.startAt);
    const endAt = new Date(data.endAt);
    
    if (endAt <= startAt) {
      return NextResponse.json(
        { error: "Data de fim deve ser posterior à data de início" },
        { status: 400 }
      );
    }

    // Validate check-in mode rules
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
      promoterId: organizerProfile.id,
      title: data.title,
      slug: data.slug,
      description: data.description,
      venue: data.venueName,
      city: data.city,
      category: data.category || null,
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

