import { prisma } from "@/lib/prisma";
import { MemberRole } from "@prisma/client";

export type ResolvedOrgContext = {
  userId: string;
  orgId: string;
  organization: { id: string; name: string; slug: string; status?: string };
  role: MemberRole;
  membershipId: string | null;
};

/**
 * Resolve a organização ativa do promotor.
 * - Com organizationId: valida membership (ou admin global).
 * - Sem organizationId: prefere org onde é proprietário, senão a mais antiga.
 */
export async function resolvePromoterOrgContext(
  userId: string,
  options?: { organizationId?: string | null; globalRole?: string | null }
): Promise<ResolvedOrgContext | null> {
  const isGlobalAdmin = options?.globalRole === "ADMIN";
  const requestedOrgId = options?.organizationId?.trim() || null;

  if (requestedOrgId) {
    if (isGlobalAdmin) {
      const org = await prisma.organization.findUnique({
        where: { id: requestedOrgId },
        select: { id: true, name: true, slug: true, status: true },
      });
      if (!org) return null;
      return {
        userId,
        orgId: org.id,
        organization: org,
        role: MemberRole.PROMOTER_OWNER,
        membershipId: null,
      };
    }

    const membership = await prisma.organizationMember.findFirst({
      where: { userId, organizationId: requestedOrgId, status: "ACTIVE" },
      include: {
        organization: { select: { id: true, name: true, slug: true, status: true } },
      },
    });
    if (!membership) return null;

    return {
      userId,
      orgId: membership.organizationId,
      organization: membership.organization,
      role: membership.role,
      membershipId: membership.id,
    };
  }

  const memberships = await prisma.organizationMember.findMany({
    where: { userId, status: "ACTIVE" },
    include: {
      organization: { select: { id: true, name: true, slug: true, status: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  if (memberships.length) {
    const preferred =
      memberships.find((m) => m.role === MemberRole.PROMOTER_OWNER) ?? memberships[0];
    return {
      userId,
      orgId: preferred.organizationId,
      organization: preferred.organization,
      role: preferred.role,
      membershipId: preferred.id,
    };
  }

  if (isGlobalAdmin) {
    const org = await prisma.organization.findFirst({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, slug: true, status: true },
    });
    if (!org) return null;
    return {
      userId,
      orgId: org.id,
      organization: org,
      role: MemberRole.PROMOTER_OWNER,
      membershipId: null,
    };
  }

  return null;
}
