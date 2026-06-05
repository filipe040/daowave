import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { can, type PermissionScope } from "./scopes";
import { prisma } from "../prisma";
import { MemberRole } from "@prisma/client";

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

    // 2. Find specific organization membership
    let membership = await prisma.organizationMember.findFirst({
        where: { userId },
        include: { organization: true },
    });

    // 3. Admin Fallback: If admin has no membership, pick first available organization
    if (!membership && isGlobalAdmin) {
        const firstOrg = await prisma.organization.findFirst({
            where: { status: "ACTIVE" },
            orderBy: { createdAt: "asc" }
        });

        if (firstOrg) {
            return {
                session,
                userId,
                orgId: firstOrg.id,
                organization: firstOrg,
                role: MemberRole.PROMOTER_OWNER,
            };
        }
    }

    if (!membership && !isGlobalAdmin) {
        redirect("/auth/signin?error=PromoterAccessDenied");
    }

    return {
        session,
        userId,
        orgId: membership?.organizationId || null,
        organization: membership?.organization,
        role: membership?.role || (isGlobalAdmin ? MemberRole.PROMOTER_OWNER : null),
    };
}

/**
 * requirePermission: Specific scope check.
 */
export async function requirePermission(scope: PermissionScope) {
    const { session, ...context } = await requirePromoter();

    const userRole = (session.user as any).role;
    if (!can(userRole, scope)) {
        // Audit log if possible?
        redirect("/promotor/unauthorized");
    }

    return { session, ...context };
}

/**
 * getOrgContext: Helper for API routes to get orgId without redirects.
 */
export async function getOrgContext() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return null;

    const userId = (session.user as any).id;
    const membership = await prisma.organizationMember.findFirst({
        where: { userId },
        select: { organizationId: true, role: true },
    });

    return membership;
}
