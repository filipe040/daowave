import { NextResponse } from "next/server";
import { getPromoterContext, type PromoterContext } from "@/lib/auth/guards";
import { assertPromoterEventAccess, TicketManagementAccessError } from "@/lib/auth/ticket-management";
import { MemberRole } from "@prisma/client";

export type PromoterApiContext = NonNullable<PromoterContext>;

export function apiUnauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function apiForbidden(message = "Sem permissão") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export async function requirePromoterApiContext(): Promise<PromoterApiContext | NextResponse> {
  const ctx = await getPromoterContext();
  if (!ctx) return apiUnauthorized();
  return ctx;
}

export function isPromoterApiContext(
  value: PromoterApiContext | NextResponse
): value is PromoterApiContext {
  return !(value instanceof NextResponse);
}

export function isGlobalAdmin(ctx: PromoterApiContext): boolean {
  return ctx.globalRole === "ADMIN";
}

type EventApiOptions = {
  requirePermission?: (role: MemberRole | string | null | undefined) => boolean;
};

export async function requirePromoterEventApi(
  eventId: string,
  options?: EventApiOptions
): Promise<{ ctx: PromoterApiContext; event: Awaited<ReturnType<typeof assertPromoterEventAccess>> } | NextResponse> {
  const ctx = await requirePromoterApiContext();
  if (!isPromoterApiContext(ctx)) return ctx;

  if (
    options?.requirePermission &&
    !options.requirePermission(ctx.role) &&
    !isGlobalAdmin(ctx)
  ) {
    return apiForbidden();
  }

  try {
    const event = await assertPromoterEventAccess(
      eventId,
      ctx.orgId,
      ctx.globalRole ?? "",
      ctx.userId
    );
    return { ctx, event };
  } catch (error) {
    if (error instanceof TicketManagementAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
