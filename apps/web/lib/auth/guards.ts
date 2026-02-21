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
    const userId = (session.user as any).id;

    // 1. Check if user is an ADMIN (can bypass org checks if needed, but usually works within one)
    const isGlobalAdmin = (session.user as any).role === "ADMIN";

    // 2. Find the primary organization membership
    // For now, we take the first active organization. In multi-tenant, we'd use a context/cookie/header.
    const membership = await prisma.organizationMember.findFirst({
        where: { userId },
        include: { organization: true },
    });

    if (!membership && !isGlobalAdmin) {
        // If not a member and not an admin, they can't access /promotor
        // We redirect to a "Setup Organization" or contact support page
        redirect("/promotor/setup");
    }

    return {
        session,
        userId,
        orgId: membership?.organizationId || null,
        organization: membership?.organization,
        role: membership?.role || (isGlobalAdmin ? "OWNER" : null),
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
