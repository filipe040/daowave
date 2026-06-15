import { prisma } from "@/lib/prisma";
import { MemberRole } from "@prisma/client";
import { createAuditLog } from "@/lib/audit";
import {
  canRemoveMembers,
  canRemoveTargetMember,
  isOrgOwner,
} from "@/lib/auth/member-permissions";

export class OrgMemberRemovalError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function removeOrganizationMember(params: {
  organizationId: string;
  memberId: string;
  actorUserId: string;
  actorMemberRole: MemberRole | string | null | undefined;
  isGlobalAdmin: boolean;
}) {
  const { organizationId, memberId, actorUserId, actorMemberRole, isGlobalAdmin } = params;

  if (!isGlobalAdmin && !canRemoveMembers(actorMemberRole)) {
    throw new OrgMemberRemovalError(
      "Sem permissão para remover membros desta organização.",
      403
    );
  }

  const member = await prisma.organizationMember.findFirst({
    where: { id: memberId, organizationId },
    include: {
      user: { select: { id: true, email: true, name: true, role: true } },
      organization: { select: { name: true } },
    },
  });

  if (!member) {
    throw new OrgMemberRemovalError("Membro não encontrado.", 404);
  }

  if (!isGlobalAdmin && !canRemoveTargetMember(actorMemberRole, member.role)) {
    throw new OrgMemberRemovalError("Sem permissão para remover este membro.", 403);
  }

  if (member.userId === actorUserId) {
    throw new OrgMemberRemovalError("Não pode remover a sua própria conta da equipa.", 400);
  }

  if (member.user.role === "ADMIN" && !isGlobalAdmin) {
    throw new OrgMemberRemovalError(
      "Não tem permissão para remover administradores da plataforma.",
      403
    );
  }

  if (isOrgOwner(member.role)) {
    const ownerCount = await prisma.organizationMember.count({
      where: {
        organizationId,
        role: MemberRole.PROMOTER_OWNER,
        status: "ACTIVE",
      },
    });

    if (ownerCount <= 1) {
      throw new OrgMemberRemovalError(
        "Não é possível remover o último proprietário da organização.",
        400
      );
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.couponCommission.deleteMany({ where: { memberId: member.id } });
    await tx.coupon.updateMany({
      where: { assignedMemberId: member.id },
      data: { assignedMemberId: null },
    });
    await tx.organizationMember.delete({ where: { id: memberId } });
  });

  await createAuditLog({
    action: "ORG_MEMBER_REMOVED",
    userId: actorUserId,
    organizationId,
    entityType: "OrganizationMember",
    entityId: memberId,
    details: {
      removedUserId: member.userId,
      removedUserEmail: member.user.email,
      organizationName: member.organization.name,
      role: member.role,
    },
  });

  return { success: true as const };
}
