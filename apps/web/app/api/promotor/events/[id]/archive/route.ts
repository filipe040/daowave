import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canManageEvents } from "@/lib/auth/member-permissions";
import { assertPromoterEventAccess, TicketManagementAccessError } from "@/lib/auth/ticket-management";
import { apiForbidden, isPromoterApiContext, requirePromoterApiContext } from "@/lib/auth/promoter-api";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requirePromoterApiContext();
    if (!isPromoterApiContext(ctx)) return ctx;

    if (!canManageEvents(ctx.role) && ctx.globalRole !== "ADMIN") {
      return apiForbidden("Sem permissão para arquivar eventos.");
    }

    const { id: eventId } = await params;
    await assertPromoterEventAccess(eventId, ctx.orgId, ctx.globalRole ?? "", ctx.userId);

    const body = await request.json().catch(() => ({}));
    const archive = body.archive === true;

    await prisma.event.update({
      where: { id: eventId },
      data: { archivedAt: archive ? new Date() : null },
    });

    return NextResponse.json({
      archivedAt: archive ? new Date().toISOString() : null,
    });
  } catch (error) {
    if (error instanceof TicketManagementAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[archive] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
