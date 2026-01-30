import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { safeLog } from "@/lib/security";

const UpdateEventSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().min(1).optional(),
  category: z.string().optional().nullable(),
  venueName: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  startAt: z.union([
    z.string().refine((val) => val === "" || !isNaN(Date.parse(val)), { message: "Data de início inválida" }),
    z.null(),
  ]).optional().transform((val) => (val === "" || val == null ? undefined : val)),
  endAt: z.union([
    z.string().refine((val) => val === "" || !isNaN(Date.parse(val)), { message: "Data de fim inválida" }),
    z.null(),
  ]).optional().transform((val) => (val === "" || val == null ? undefined : val)),
  timezone: z.string().optional(),
  
  // Check-in
  checkinMode: z.enum(["SINGLE", "MULTI"]).optional(),
  maxEntries: z.number().int().positive().optional().nullable(),
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
  consentRGPD: z.boolean().optional(),
  
  // Accessibility
  wheelchairAccess: z.boolean().optional(),
  signLanguageSupport: z.boolean().optional(),
  accessibleWC: z.boolean().optional(),
  accessibilityNotes: z.string().optional().nullable(),
  
  // Contact
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional().nullable(),
  supportInstructions: z.string().optional().nullable(),
  
  // Media
  bannerUrl: z.string().refine((val) => {
    if (!val) return true; // nullable
    // Accept imgur.com links (with or without protocol, direct image links)
    if (val.includes("imgur.com")) {
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

// GET /api/organizer/events/[id] - Get single event
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // For admins, skip organizer profile check
    let organizerProfile = null;
    if (session.user.role === "PROMOTER") {
      organizerProfile = await prisma.promoterProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!organizerProfile || organizerProfile.status !== "APPROVED") {
        return NextResponse.json(
          { error: "Organizer profile not approved" },
          { status: 403 }
        );
      }
    }

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        ticketLots: true,
        _count: {
          select: {
            tickets: true,
            orders: { where: { status: "PAID" } },
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Verify ownership (admins can access any event)
    if (session.user.role !== "ADMIN" && organizerProfile && event.promoterId !== organizerProfile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(event);
  } catch (error) {
    safeLog.error("Get event error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/organizer/events/[id] - Update event
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // For admins, skip organizer profile check
    let organizerProfile = null;
    if (session.user.role === "PROMOTER") {
      organizerProfile = await prisma.promoterProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!organizerProfile || organizerProfile.status !== "APPROVED") {
        return NextResponse.json(
          { error: "Organizer profile not approved" },
          { status: 403 }
        );
      }
    }

    // Verify ownership
    const existingEvent = await prisma.event.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Admins can access any event
    if (session.user.role !== "ADMIN" && organizerProfile && existingEvent.promoterId !== organizerProfile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data = UpdateEventSchema.parse(body);

    // Validate dates if provided
    if (data.startAt || data.endAt) {
      const startAt = data.startAt ? new Date(data.startAt) : existingEvent.startAt;
      const endAt = data.endAt ? new Date(data.endAt) : existingEvent.endAt;
      
      if (isNaN(startAt.getTime())) {
        return NextResponse.json(
          { error: "Data de início inválida" },
          { status: 400 }
        );
      }
      if (isNaN(endAt.getTime())) {
        return NextResponse.json(
          { error: "Data de fim inválida" },
          { status: 400 }
        );
      }
      
      if (endAt <= startAt) {
        return NextResponse.json(
          { error: "Data de fim deve ser posterior à data de início" },
          { status: 400 }
        );
      }
    }

    // Check slug uniqueness if changed
    if (data.slug && data.slug !== existingEvent.slug) {
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

    // Prepare update data — only fields that exist on Event model (schema.prisma)
    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.venueName !== undefined) updateData.venue = data.venueName;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.startAt !== undefined) updateData.startAt = new Date(data.startAt);
    if (data.endAt !== undefined) updateData.endAt = new Date(data.endAt);
    if (data.checkinMode !== undefined) updateData.checkinMode = data.checkinMode;
    if (data.maxEntries !== undefined) updateData.maxEntries = data.maxEntries;
    if (data.entryWindowStartAt !== undefined) updateData.checkinStartAt = data.entryWindowStartAt ? new Date(data.entryWindowStartAt) : null;
    if (data.entryWindowEndAt !== undefined) updateData.checkinEndAt = data.entryWindowEndAt ? new Date(data.entryWindowEndAt) : null;
    if (data.bannerUrl !== undefined) {
      let bannerUrl = data.bannerUrl;
      if (bannerUrl && bannerUrl.includes("imgur.com")) {
        if (!bannerUrl.startsWith("http")) {
          const match = bannerUrl.match(/imgur\.com\/([a-zA-Z0-9]+)/);
          if (match && !bannerUrl.includes("/a/")) {
            bannerUrl = `https://i.imgur.com/${match[1]}.jpg`;
          } else {
            bannerUrl = `https://${bannerUrl}`;
          }
        }
      }
      updateData.bannerUrl = bannerUrl;
    }

    const event = await prisma.event.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(event);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    safeLog.error("Update event error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

