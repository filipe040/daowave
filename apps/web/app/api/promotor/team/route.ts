import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyRateLimit, RATE_LIMITS, safeLog } from "@/lib/security";
import { requirePromoter } from "@/lib/auth/guards";

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

        const canRemoveMembers =
            isGlobalAdmin ||
            actorRole === "PROMOTER_OWNER" ||
            actorRole === "OWNER";

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
            meta: { currentUserId: userId, canRemoveMembers, isGlobalAdmin },
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
        const canInvite = ["PROMOTER_OWNER", "PROMOTER_MANAGER", "OWNER", "MANAGER"].includes(actorRole as string);

        if (!canInvite) {
            return NextResponse.json({ error: "Permissões insuficientes para convidar membros." }, { status: 403 });
        }

        const { email, role } = await req.json();

        if (!email || !role) {
            return NextResponse.json({ error: "Email e role são obrigatórios." }, { status: 400 });
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
