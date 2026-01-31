/**
 * GET /api/promotor/coupons — List coupons (canonical).
 * POST /api/promotor/coupons — Create coupon (canonical).
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CouponSchema = z.object({
  eventId: z.string().uuid(),
  code: z.string().min(1).max(20).regex(/^[A-Z0-9]+$/, "Apenas letras maiúsculas e números"),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.number().positive(),
  maxUses: z.number().positive().nullable(),
  startsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Formato de data inválido"),
  endsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Formato de data inválido"),
}).refine((data) => {
  if (data.discountType === "PERCENTAGE") {
    return data.discountValue >= 1 && data.discountValue <= 100;
  }
  return true;
}, {
  message: "Percentagem deve estar entre 1% e 100%",
  path: ["discountValue"],
}).refine((data) => {
  return new Date(data.endsAt) > new Date(data.startsAt);
}, {
  message: "Data de fim deve ser posterior à data de início",
  path: ["endsAt"],
});

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as { role?: string }).role !== "PROMOTER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const organizer = await prisma.promoterProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!organizer || organizer.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Promoter not approved" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const data = CouponSchema.parse(body);

    const event = await prisma.event.findFirst({
      where: {
        id: data.eventId,
        promoterId: organizer.id,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found or access denied" },
        { status: 404 }
      );
    }

    try {
      const existingCoupon = await prisma.coupon.findUnique({
        where: { code: data.code },
      });

      if (existingCoupon) {
        return NextResponse.json(
          { error: "Código já existe" },
          { status: 400 }
        );
      }

      const coupon = await prisma.coupon.create({
        data: {
          eventId: data.eventId,
          code: data.code,
          discountType: data.discountType,
          discountValue: data.discountValue,
          maxUses: data.maxUses,
          startsAt: new Date(data.startsAt),
          endsAt: new Date(data.endsAt),
        },
      });

      return NextResponse.json({ coupon }, { status: 201 });
    } catch (error: any) {
      if (error?.code === "P2021" || error?.message?.includes("does not exist")) {
        return NextResponse.json(
          { error: "Funcionalidade de cupões não disponível. Por favor, execute a migração do Prisma." },
          { status: 503 }
        );
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Error creating coupon:", error);
    return NextResponse.json(
      { error: "Failed to create coupon" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as { role?: string }).role !== "PROMOTER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizer = await prisma.promoterProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!organizer) {
    return NextResponse.json({ error: "Promoter not found" }, { status: 404 });
  }

  let coupons: Array<{
    id: string;
    eventId: string;
    code: string;
    discountType: string;
    discountValue: number;
    maxUses: number | null;
    usedCount: number;
    isActive: boolean;
    startsAt: Date;
    endsAt: Date;
    createdAt: Date;
    updatedAt: Date;
    event: {
      title: string;
      slug: string;
    };
  }> = [];
  try {
    coupons = await prisma.coupon.findMany({
      where: {
        event: {
          promoterId: organizer.id,
        },
      },
      include: {
        event: {
          select: {
            title: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error: any) {
    if (error?.code === "P2021" || error?.message?.includes("does not exist")) {
      console.warn("Coupon table not found. Please run Prisma migration.");
      coupons = [];
    } else {
      throw error;
    }
  }

  return NextResponse.json({ coupons });
}
