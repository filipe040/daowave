import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "../prisma";
import { MemberRole } from "@prisma/client";
import type { Session } from "next-auth";
import {
  canManageOrgSettings,
  canInviteMembers,
  canRemoveMembers,
} from "@/lib/auth/member-permissions";
import { hasOrgPermission, Permission } from "../rbac";
import { resolvePromoterOrgContext } from "./org-context";

/**
 * requireAuth: Basic guard to ensure user is logged in.
 * Returns session or redirects to signin.
 */
export async function requireAuth() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        redirect("/auth/signin");
    }
    return session;
}

/**
 * requirePromoter: Ensures user has a promoter-related role and belongs to an organization.
 * Fetches the organization context and returns { session, organization, membership }.
 */
export async function requirePromoter() {
    const session = await requireAuth();
    const userId = (session.user as any)?.id;

    if (!userId) {
        redirect("/auth/signin");
    }

    // 1. Check if user is an ADMIN (can bypass org checks)
    const isGlobalAdmin = (session.user as any)?.role === "ADMIN";

    const resolved = await resolvePromoterOrgContext(userId, {
      globalRole: isGlobalAdmin ? "ADMIN" : (session.user as any)?.role,
    });

    if (!resolved) {
        redirect("/auth/signin?error=PromoterAccessDenied");
    }

    const membership = resolved.membershipId
        ? await prisma.organizationMember.findUnique({
            where: { id: resolved.membershipId },
            include: { organization: true },
          })
        : null;

    return {
        session,
        userId,
        orgId: resolved.orgId,
        organization: membership?.organization ?? (await prisma.organization.findUnique({ where: { id: resolved.orgId } })),
        role: resolved.role,
    };
}

export type PromoterContext = Awaited<ReturnType<typeof getPromoterContext>>;

/**
 * Versão para API routes — retorna null em vez de redirect.
 */
export async function getPromoterContext(organizationId?: string | null) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;
    if (!session?.user || !userId) return null;

    const globalRole = (session.user as { role?: string }).role;
    const resolved = await resolvePromoterOrgContext(userId, {
      organizationId,
      globalRole,
    });
    if (!resolved) return null;

    const organization =
      (await prisma.organization.findUnique({ where: { id: resolved.orgId } })) ??
      resolved.organization;

    return {
        session,
        userId,
        orgId: resolved.orgId,
        organization,
        role: resolved.role,
        globalRole,
    };
}

/**
 * requirePermission: Specific scope check.
 */
export async function requirePermission(permission: Permission) {
    const { session, role, ...context } = await requirePromoter();
    const globalRole = (session.user as { role?: string }).role;

    if (globalRole === "ADMIN") {
        return { session, role, ...context };
    }

    if (role && hasOrgPermission(role, permission)) {
        return { session, role, ...context };
    }

    redirect("/promotor/unauthorized");
}

/**
 * getOrgContext: Helper for API routes to get orgId without redirects.
 */
export async function getOrgContext() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return null;

    const userId = (session.user as any).id;
    const membership = await prisma.organizationMember.findFirst({
        where: { userId, status: "ACTIVE" },
        select: { organizationId: true, role: true },
    });

    return membership;
}

/** Proprietário, gestor ou administrador global podem gerir cupões. */
export function canManageOrganizationCoupon(
    session: Session,
    memberRole: MemberRole | null | undefined
): boolean {
    const globalRole = (session.user as { role?: string })?.role;
    if (globalRole === "ADMIN") return true;
    if (!memberRole) return false;
    return (
        memberRole === MemberRole.PROMOTER_OWNER ||
        memberRole === MemberRole.PROMOTER_MANAGER
    );
}

export { canInviteMembers, canRemoveMembers };
