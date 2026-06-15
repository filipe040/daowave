import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyRateLimit, RATE_LIMITS, safeLog } from "@/lib/security";
import { requirePromoter } from "@/lib/auth/guards";
import { canInviteMembers, canRemoveMembers, canAssignMemberRole, isValidMemberRole, INVITABLE_MEMBER_ROLES, INVITABLE_MEMBER_ROLES_WITH_OWNER, isOrgOwner, MEMBER_ROLE_LABELS, MEMBER_ROLE_DESCRIPTIONS } from "@/lib/auth/member-permissions";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    const rateLimitRes = await applyRateLimit(req, RATE_LIMITS.promotorRead);
    if (rateLimitRes) return rateLimitRes;

    try {
        const { session, orgId, userId, role: actorRole } = await requirePromoter();
        const isGlobalAdmin = (session.user as { role?: string }).role === "ADMIN";

        if (!orgId) {
            return NextResponse.json({ data: [], total: 0, meta: { currentUserId: userId, canRemoveMembers: isGlobalAdmin, isGlobalAdmin } });
        }

        const canRemoveMembersFlag =
            isGlobalAdmin || canRemoveMembers(actorRole);

        // Fetch all members of that organization (org-level, not per-event)
        const members = await prisma.organizationMember.findMany({
            where: { organizationId: orgId },
            orderBy: [{ organization: { name: "asc" } }, { role: "asc" }],
            select: {
                id: true,
                role: true,
                createdAt: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                        role: true,
                    },
                },
                organization: {
                    select: { id: true, name: true },
                },
            },
        });

        return NextResponse.json({
            data: members,
            total: members.length,
            meta: {
                currentUserId: userId,
                canRemoveMembers: canRemoveMembersFlag,
                isGlobalAdmin,
                canInviteMembers: isGlobalAdmin || canInviteMembers(actorRole),
                invitableRoles: (isGlobalAdmin || isOrgOwner(actorRole))
                    ? INVITABLE_MEMBER_ROLES_WITH_OWNER
                    : INVITABLE_MEMBER_ROLES,
                roleLabels: MEMBER_ROLE_LABELS,
                roleDescriptions: MEMBER_ROLE_DESCRIPTIONS,
            },
        });
    } catch (error) {
        safeLog.error("Promotor team error", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { session, orgId, role: actorRole } = await requirePromoter();

        if (!orgId) {
            return NextResponse.json({ error: "Contexto de organização não encontrado." }, { status: 400 });
        }
        if (!canInviteMembers(actorRole) && (session.user as { role?: string }).role !== "ADMIN") {
            return NextResponse.json({ error: "Permissões insuficientes para convidar membros." }, { status: 403 });
        }

        const { email, role } = await req.json();

        if (!email || !role) {
            return NextResponse.json({ error: "Email e role são obrigatórios." }, { status: 400 });
        }

        if (!isValidMemberRole(role)) {
            return NextResponse.json({ error: "Cargo inválido." }, { status: 400 });
        }

        const isGlobalAdmin = (session.user as { role?: string }).role === "ADMIN";
        if (!canAssignMemberRole(actorRole, role) && !isGlobalAdmin) {
            return NextResponse.json({ error: "Sem permissão para atribuir este cargo." }, { status: 403 });
        }

        // Check if user is already a member
        const existingMember = await prisma.organizationMember.findFirst({
            where: {
                organizationId: orgId,
                user: { email: email.toLowerCase().trim() }
            }
        });

        if (existingMember) {
            return NextResponse.json({ error: "Este utilizador já é membro da organização." }, { status: 400 });
        }

        const { InviteService } = await import("@/lib/services/invite.service");
        const { invite, rawToken } = await InviteService.createInvite({
            email,
            organizationId: orgId,
            role
        });

        const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { name: true } });
        const inviteLink = `${process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"}/invites/accept?token=${rawToken}`;

        try {
            const { EmailService } = await import("@/lib/email-service");
            await EmailService.sendTemplate({
                to: email.toLowerCase().trim(),
                templateId: "invite-organization",
                variables: {
                    organizationName: org?.name ?? "LivePass",
                    acceptUrl: inviteLink,
                    expiresIn: "48 horas",
                },
                idempotencyKey: `invite-promotor-${orgId}-${email}-${invite.id}`,
            });
        } catch (emailError) {
            safeLog.error("Failed to send invite email", emailError);
        }

        return NextResponse.json({ success: true, inviteId: invite.id });
    } catch (error: any) {
        safeLog.error("Error creating invite", error);
        return NextResponse.json({ error: error.message || "Erro ao criar convite" }, { status: 500 });
    }
}
