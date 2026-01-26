import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CreateEventSchema = z.object({
  promoterId: z.string().min(1, "Organizador é obrigatório"),
  title: z.string().min(1, "Título é obrigatório"),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug inválido"),
  description: z.string().min(1, "Descrição é obrigatória"),
  category: z.string().optional(),
  venueName: z.string().min(1, "Nome do local é obrigatório"),
  address: z.string().min(1, "Endereço é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  startAt: z.string(),
  endAt: z.string(),
  timezone: z.string().default("Europe/Lisbon"),
  checkinMode: z.enum(["SINGLE", "MULTI"]).default("SINGLE"),
  reentryAllowed: z.boolean().default(false),
  maxEntries: z.number().int().positive().optional().nullable(),
  entryWindowStartAt: z.string().optional().nullable(),
  entryWindowEndAt: z.string().optional().nullable(),
  capacityTotal: z.number().int().positive().optional().nullable(),
  ageRestriction: z.number().int().min(0).optional().nullable(),
  refundPolicy: z.string().optional().nullable(),
  cancellationPolicy: z.string().optional().nullable(),
  termsText: z.string().optional().nullable(),
  consentRGPD: z.boolean().default(false),
  wheelchairAccess: z.boolean().default(false),
  signLanguageSupport: z.boolean().default(false),
  accessibleWC: z.boolean().default(false),
  accessibilityNotes: z.string().optional().nullable(),
  contactEmail: z.string().email("Email inválido"),
  contactPhone: z.string().optional().nullable(),
  supportInstructions: z.string().optional().nullable(),
  bannerUrl: z.string().optional().nullable(),
  galleryUrls: z.array(z.string()).optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // Verify organizer exists and is approved
    const organizer = await prisma.promoterProfile.findUnique({
      where: { id: data.promoterId },
    });

    if (!organizer || organizer.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Organizador não encontrado ou não aprovado" },
        { status: 400 }
      );
    }

    // Create event with PUBLISHED status (admin creates published events)
    const event = await prisma.event.create({
      data: {
        promoterId: data.promoterId,
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
        bannerUrl: data.bannerUrl || null,
        galleryUrls: data.galleryUrls || null,
        status: "PUBLISHED", // Admin creates published events directly
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
    console.error("Create admin event error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

