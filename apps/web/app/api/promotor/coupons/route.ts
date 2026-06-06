import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { canManageOrganizationCoupon, requirePromoter } from "@/lib/auth/guards";

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
  try {
    const { session, orgId, role } = await requirePromoter();

    if (!orgId) {
      return NextResponse.json({ error: "Organização não encontrada." }, { status: 404 });
    }

    if (!canManageOrganizationCoupon(session, role)) {
      return NextResponse.json(
        { error: "Apenas o proprietário da organização ou um administrador pode criar cupões." },
        { status: 403 }
      );
    }

    const existingOrgCoupon = await prisma.coupon.findUnique({
      where: { organizationId: orgId },
    });

    if (existingOrgCoupon) {
      return NextResponse.json(
        { error: "Esta organização já tem um cupão. Edite ou elimine o existente." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const data = CouponSchema.parse(body);

    const event = await prisma.event.findFirst({
      where: {
        id: data.eventId,
        organizationId: orgId,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Evento não encontrado ou acesso negado." },
        { status: 404 }
      );
    }

    const existingCode = await prisma.coupon.findUnique({
      where: { code: data.code },
    });

    if (existingCode) {
      return NextResponse.json(
        { error: "Código já existe" },
        { status: 400 }
      );
    }

    const coupon = await prisma.coupon.create({
      data: {
        organizationId: orgId,
        eventId: data.eventId,
        code: data.code,
        discountType: data.discountType,
        discountValue: data.discountValue,
        maxUses: data.maxUses,
        startsAt: new Date(data.startsAt),
        endsAt: new Date(data.endsAt),
      },
      include: {
        event: {
          select: { title: true, slug: true },
        },
      },
    });

    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Error creating coupon:", error);
    return NextResponse.json(
      { error: "Erro ao criar cupão" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { session, orgId, role } = await requirePromoter();

    if (!orgId) {
      return NextResponse.json({ coupon: null, coupons: [], canManage: false });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { organizationId: orgId },
      include: {
        event: {
          select: {
            title: true,
            slug: true,
          },
        },
      },
    });

    const canManage = canManageOrganizationCoupon(session, role);

    return NextResponse.json({
      coupon,
      coupons: coupon ? [coupon] : [],
      canManage,
    });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return NextResponse.json({ coupon: null, coupons: [], canManage: false });
  }
}
