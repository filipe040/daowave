import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyRateLimit, RATE_LIMITS, safeLog, createAuditLog } from "@/lib/security";
import { requirePromoter } from "@/lib/auth/guards";
import { MemberRole } from "@prisma/client";

export const dynamic = "force-dynamic";

const OWNER_ROLES: MemberRole[] = [MemberRole.PROMOTER_OWNER, MemberRole.OWNER];

function canRemoveMembers(actorRole: MemberRole | null, isGlobalAdmin: boolean): boolean {
  if (isGlobalAdmin) return true;
  if (!actorRole) return false;
  return OWNER_ROLES.includes(actorRole);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const rateLimitRes = await applyRateLimit(_req, RATE_LIMITS.promotorRead);
  if (rateLimitRes) return rateLimitRes;

  try {
    const { session, userId, orgId, role: actorRole } = await requirePromoter();
    const isGlobalAdmin = (session.user as { role?: string }).role === "ADMIN";

    if (!orgId) {
      return NextResponse.json({ error: "Contexto de organização não encontrado." }, { status: 400 });
    }

    if (!canRemoveMembers(actorRole as MemberRole | null, isGlobalAdmin)) {
      return NextResponse.json(
        { error: "Apenas proprietários ou administradores podem remover membros." },
        { status: 403 }
      );
    }

    const { memberId } = await params;

    const member = await prisma.organizationMember.findFirst({
      where: { id: memberId, organizationId: orgId },
      include: {
        user: { select: { id: true, email: true, name: true } },
        organization: { select: { name: true } },
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Membro não encontrado." }, { status: 404 });
    }

    if (member.userId === userId) {
      return NextResponse.json(
        { error: "Não pode remover a sua própria conta da equipa." },
        { status: 400 }
      );
    }

    if (OWNER_ROLES.includes(member.role)) {
      const ownerCount = await prisma.organizationMember.count({
        where: {
          organizationId: orgId,
          role: { in: OWNER_ROLES },
        },
      });

      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: "Não é possível remover o último proprietário da organização." },
          { status: 400 }
        );
      }
    }

    await prisma.organizationMember.delete({ where: { id: memberId } });

    await createAuditLog({
      action: "ORG_MEMBER_REMOVED",
      userId,
      organizationId: orgId,
      entityType: "OrganizationMember",
      entityId: memberId,
      details: {
        removedUserId: member.userId,
        removedUserEmail: member.user.email,
        organizationName: member.organization.name,
        role: member.role,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    safeLog.error("Promotor team remove error", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
