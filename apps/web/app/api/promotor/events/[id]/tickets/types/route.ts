/**
 * POST /api/promotor/events/[id]/tickets/types — legacy path (501).
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { safeLog } from "@/lib/security";
import { canManageTicketContent } from "@/lib/auth/member-permissions";
import { assertPromoterEventAccess, TicketManagementAccessError } from "@/lib/auth/ticket-management";
import { requirePromoterApiContext, isPromoterApiContext, apiForbidden } from "@/lib/auth/promoter-api";

const TicketTypeSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional().nullable(),
  basePrice: z.number().int().positive("Preço deve ser positivo"),
  currency: z.string().min(1, "Moeda é obrigatória"),
});

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requirePromoterApiContext();
  if (!isPromoterApiContext(ctx)) return ctx;

  if (!canManageTicketContent(ctx.role) && ctx.globalRole !== "ADMIN") {
    return apiForbidden("Sem permissão para gerir bilhetes.");
  }

  const { id } = await params;

  try {
    await assertPromoterEventAccess(id, ctx.orgId, ctx.globalRole ?? "", ctx.userId);

    const body = await req.json();
    TicketTypeSchema.parse(body);

    return NextResponse.json(
      { error: "TicketType functionality not available. Model not in schema." },
      { status: 501 }
    );
  } catch (error) {
    if (error instanceof TicketManagementAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    safeLog.error("Error creating ticket type", error);
    return NextResponse.json({ error: "Failed to create ticket type" }, { status: 500 });
  }
}
