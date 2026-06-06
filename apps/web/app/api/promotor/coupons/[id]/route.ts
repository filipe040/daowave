/**
 * GET /api/promotor/coupons/[id] — Get coupon (canonical).
 * PUT /api/promotor/coupons/[id] — Update coupon (canonical).
 * DELETE /api/promotor/coupons/[id] — Delete coupon (canonical).
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { canManageOrganizationCoupon, requirePromoter } from "@/lib/auth/guards";
import {
  couponAssignmentFields,
  couponInclude,
  resolveCouponAssignment,
} from "@/lib/coupons/coupon-assignment";

const UpdateCouponSchema = z.object({
  eventId: z.string().uuid().optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.number().positive(),
  maxUses: z.number().positive().nullable(),
  startsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Formato de data inválido"),
  endsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Formato de data inválido"),
  isActive: z.boolean(),
  ...couponAssignmentFields,
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

async function getOrgCoupon(id: string, orgId: string) {
  return prisma.coupon.findFirst({
    where: {
      id,
      organizationId: orgId,
    },
    include: couponInclude,
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId } = await requirePromoter();
    const { id } = await params;

    if (!orgId) {
      return NextResponse.json({ error: "Organização não encontrada." }, { status: 404 });
    }

    const coupon = await getOrgCoupon(id, orgId);

    if (!coupon) {
      return NextResponse.json({ error: "Cupão não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ coupon });
  } catch (error) {
    console.error("Error fetching coupon:", error);
    return NextResponse.json({ error: "Erro ao carregar cupão" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, orgId, role } = await requirePromoter();
    const { id } = await params;

    if (!orgId) {
      return NextResponse.json({ error: "Organização não encontrada." }, { status: 404 });
    }

    if (!canManageOrganizationCoupon(session, role)) {
      return NextResponse.json(
        { error: "Apenas o proprietário da organização ou um administrador pode editar cupões." },
        { status: 403 }
      );
    }

    const existingCoupon = await getOrgCoupon(id, orgId);

    if (!existingCoupon) {
      return NextResponse.json(
        { error: "Cupão não encontrado ou acesso negado" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const data = UpdateCouponSchema.parse(body);

    if (data.eventId && data.eventId !== existingCoupon.eventId) {
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
    }

    let assignment: { assignedMemberId: string | null; commissionCents: number | null };
    try {
      assignment = await resolveCouponAssignment(
        orgId,
        data.assignedMemberId !== undefined
          ? data.assignedMemberId
          : existingCoupon.assignedMemberId,
        data.commissionCents !== undefined
          ? data.commissionCents
          : existingCoupon.commissionCents
      );
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Atribuição inválida" },
        { status: 400 }
      );
    }

    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        ...(data.eventId ? { eventId: data.eventId } : {}),
        discountType: data.discountType,
        discountValue: data.discountValue,
        maxUses: data.maxUses,
        startsAt: new Date(data.startsAt),
        endsAt: new Date(data.endsAt),
        isActive: data.isActive,
        assignedMemberId: assignment.assignedMemberId,
        commissionCents: assignment.commissionCents,
      },
      include: couponInclude,
    });

    return NextResponse.json({ coupon });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Error updating coupon:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar cupão" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, orgId, role } = await requirePromoter();
    const { id } = await params;

    if (!orgId) {
      return NextResponse.json({ error: "Organização não encontrada." }, { status: 404 });
    }

    if (!canManageOrganizationCoupon(session, role)) {
      return NextResponse.json(
        { error: "Apenas o proprietário da organização ou um administrador pode eliminar cupões." },
        { status: 403 }
      );
    }

    const coupon = await getOrgCoupon(id, orgId);

    if (!coupon) {
      return NextResponse.json(
        { error: "Cupão não encontrado ou acesso negado" },
        { status: 404 }
      );
    }

    await prisma.coupon.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    return NextResponse.json(
      { error: "Erro ao eliminar cupão" },
      { status: 500 }
    );
  }
}
