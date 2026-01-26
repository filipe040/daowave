import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { safeLog } from "@/lib/security";

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

    const events = selectAll
      ? await prisma.event.findMany({
          where: { promoterId: organizerProfile.id },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            slug: true,
            startAt: true,
            status: true,
          },
        })
      : await prisma.event.findMany({
          where: { promoterId: organizerProfile.id },
          orderBy: { createdAt: "desc" },
          include: {
            _count: {
              select: {
                tickets: true,
                orders: { where: { status: "PAID" } },
              },
            },
          },
        });

    return NextResponse.json(selectAll ? { events } : events);
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
  startAt: z.string().datetime().or(z.string().refine((val) => {
    // Accept datetime-local format or ISO format
    return !isNaN(Date.parse(val));
  }, { message: "Data inválida" })),
  endAt: z.string().datetime().or(z.string().refine((val) => {
    return !isNaN(Date.parse(val));
  }, { message: "Data inválida" })),
  timezone: z.string().default("Europe/Lisbon"),
  
  // Check-in
  checkinMode: z.enum(["SINGLE", "MULTI"]).default("SINGLE"),
  reentryAllowed: z.boolean().default(false),
  maxEntries: z.number().int().positive().optional(),
  entryWindowStartAt: z.string().datetime().optional().nullable(),
  entryWindowEndAt: z.string().datetime().optional().nullable(),
  
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
      // imgur.com links can be: https://imgur.com/xxx, https://i.imgur.com/xxx, imgur.com/xxx, etc.
      // Also accept direct image links: https://i.imgur.com/xxx.jpg
      return true;
    }
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

    if (!data.reentryAllowed && data.checkinMode === "MULTI") {
      return NextResponse.json(
        { error: "Modo MULTI requer reentryAllowed=true" },
        { status: 400 }
      );
    }

    // Check slug uniqueness
    const existingEvent = await prisma.event.findUnique({
      where: { slug: data.slug },
    });

    if (existingEvent) {
      return NextResponse.json(
        { error: "Já existe um evento com este slug" },
        { status: 400 }
      );
    }

    // Create event
    const event = await prisma.event.create({
      data: {
        promoterId: organizerProfile.id,
        title: data.title,
        slug: data.slug,
        description: data.description,
        category: data.category || null,
        venueName: data.venueName,
        address: data.address,
        city: data.city,
        startAt,
        endAt,
        timezone: data.timezone,
        checkinMode: data.checkinMode,
        reentryAllowed: data.reentryAllowed,
        maxEntries: data.maxEntries || null,
        entryWindowStartAt: data.entryWindowStartAt ? new Date(data.entryWindowStartAt) : null,
        entryWindowEndAt: data.entryWindowEndAt ? new Date(data.entryWindowEndAt) : null,
        capacityTotal: data.capacityTotal || null,
        ageRestriction: data.ageRestriction || null,
        refundPolicy: data.refundPolicy || null,
        cancellationPolicy: data.cancellationPolicy || null,
        termsText: data.termsText || null,
        consentRGPD: data.consentRGPD,
        wheelchairAccess: data.wheelchairAccess,
        signLanguageSupport: data.signLanguageSupport,
        accessibleWC: data.accessibleWC,
        accessibilityNotes: data.accessibilityNotes || null,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone || null,
        supportInstructions: data.supportInstructions || null,
        bannerUrl: (() => {
          // Normalize imgur URLs
          let bannerUrl = data.bannerUrl;
          if (bannerUrl && bannerUrl.includes("imgur.com")) {
            if (!bannerUrl.startsWith("http")) {
              // Convert imgur.com/xxx to https://i.imgur.com/xxx.jpg for direct image links
              const match = bannerUrl.match(/imgur\.com\/([a-zA-Z0-9]+)/);
              if (match && !bannerUrl.includes("/a/")) {
                bannerUrl = `https://i.imgur.com/${match[1]}.jpg`;
              } else {
                bannerUrl = `https://${bannerUrl}`;
              }
            }
          }
          return bannerUrl || null;
        })(),
        galleryUrls: data.galleryUrls || null,
        status: "DRAFT",
      } as any,
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

