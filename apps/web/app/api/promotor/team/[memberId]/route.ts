import { NextResponse } from "next/server";
import { applyRateLimit, RATE_LIMITS, safeLog } from "@/lib/security";
import { getPromoterContext } from "@/lib/auth/guards";
import {
  OrgMemberRemovalError,
  removeOrganizationMember,
} from "@/lib/services/org-member.service";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const rateLimitRes = await applyRateLimit(req, RATE_LIMITS.promotorRead);
  if (rateLimitRes) return rateLimitRes;

  try {
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");

    const ctx = await getPromoterContext(organizationId);
    if (!ctx) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (!ctx.orgId) {
      return NextResponse.json({ error: "Contexto de organização não encontrado." }, { status: 400 });
    }

    const isGlobalAdmin = ctx.globalRole === "ADMIN";
    const { memberId } = await params;

    const result = await removeOrganizationMember({
      organizationId: ctx.orgId,
      memberId,
      actorUserId: ctx.userId,
      actorMemberRole: ctx.role,
      isGlobalAdmin,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof OrgMemberRemovalError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    safeLog.error("Promotor team remove error", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
