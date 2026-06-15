import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyRateLimit, RATE_LIMITS, safeLog } from "@/lib/security";
import { getPromoterContext } from "@/lib/auth/guards";
import {
  canInviteMembers,
  canRemoveMembers,
  canRemoveTargetMember,
  canAssignMemberRole,
  isValidMemberRole,
  INVITABLE_MEMBER_ROLES,
  INVITABLE_MEMBER_ROLES_WITH_OWNER,
  isOrgOwner,
  MEMBER_ROLE_LABELS,
  MEMBER_ROLE_DESCRIPTIONS,
} from "@/lib/auth/member-permissions";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const rateLimitRes = await applyRateLimit(req, RATE_LIMITS.promotorRead);
  if (rateLimitRes) return rateLimitRes;

  try {
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");

    const ctx = await getPromoterContext(organizationId);
    if (!ctx) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const isGlobalAdmin = ctx.globalRole === "ADMIN";

    if (!ctx.orgId) {
      return NextResponse.json({
        data: [],
        total: 0,
        meta: {
          currentUserId: ctx.userId,
          canRemoveMembers: isGlobalAdmin,
          isGlobalAdmin,
          organizations: [],
        },
      });
    }

    const userOrgs = await prisma.organizationMember.findMany({
      where: { userId: ctx.userId, status: "ACTIVE" },
      include: { organization: { select: { id: true, name: true, slug: true } } },
      orderBy: { organization: { name: "asc" } },
    });

    const members = await prisma.organizationMember.findMany({
      where: { organizationId: ctx.orgId, status: "ACTIVE" },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
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

    const canRemoveMembersFlag = isGlobalAdmin || canRemoveMembers(ctx.role);

    return NextResponse.json({
      data: members,
      total: members.length,
      meta: {
        currentUserId: ctx.userId,
        organizationId: ctx.orgId,
        organizationName: ctx.organization?.name,
        actorRole: ctx.role,
        canRemoveMembers: canRemoveMembersFlag,
        isGlobalAdmin,
        canInviteMembers: isGlobalAdmin || canInviteMembers(ctx.role),
        invitableRoles:
          isGlobalAdmin || isOrgOwner(ctx.role)
            ? INVITABLE_MEMBER_ROLES_WITH_OWNER
            : INVITABLE_MEMBER_ROLES,
        roleLabels: MEMBER_ROLE_LABELS,
        roleDescriptions: MEMBER_ROLE_DESCRIPTIONS,
        organizations: userOrgs.map((m) => ({
          id: m.organization.id,
          name: m.organization.name,
          slug: m.organization.slug,
          role: m.role,
        })),
        canRemoveTarget: Object.fromEntries(
          members.map((m) => [
            m.id,
            isGlobalAdmin || canRemoveTargetMember(ctx.role, m.role),
          ])
        ),
      },
    });
  } catch (error) {
    safeLog.error("Promotor team error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const organizationId = typeof body.organizationId === "string" ? body.organizationId : null;

    const ctx = await getPromoterContext(organizationId);
    if (!ctx) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (!ctx.orgId) {
      return NextResponse.json({ error: "Contexto de organização não encontrado." }, { status: 400 });
    }

    const isGlobalAdmin = ctx.globalRole === "ADMIN";
    if (!canInviteMembers(ctx.role) && !isGlobalAdmin) {
      return NextResponse.json({ error: "Permissões insuficientes para convidar membros." }, { status: 403 });
    }

    const { email, role } = body;

    if (!email || !role) {
      return NextResponse.json({ error: "Email e role são obrigatórios." }, { status: 400 });
    }

    if (!isValidMemberRole(role)) {
      return NextResponse.json({ error: "Cargo inválido." }, { status: 400 });
    }

    if (!canAssignMemberRole(ctx.role, role) && !isGlobalAdmin) {
      return NextResponse.json({ error: "Sem permissão para atribuir este cargo." }, { status: 403 });
    }

    const existingMember = await prisma.organizationMember.findFirst({
      where: {
        organizationId: ctx.orgId,
        user: { email: email.toLowerCase().trim() },
      },
    });

    if (existingMember) {
      return NextResponse.json({ error: "Este utilizador já é membro da organização." }, { status: 400 });
    }

    const { InviteService } = await import("@/lib/services/invite.service");
    const { invite, rawToken } = await InviteService.createInvite({
      email,
      organizationId: ctx.orgId,
      role,
    });

    const org = await prisma.organization.findUnique({
      where: { id: ctx.orgId },
      select: { name: true },
    });
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
        idempotencyKey: `invite-promotor-${ctx.orgId}-${email}-${invite.id}`,
      });
    } catch (emailError) {
      safeLog.error("Failed to send invite email", emailError);
    }

    return NextResponse.json({ success: true, inviteId: invite.id });
  } catch (error: unknown) {
    safeLog.error("Error creating invite", error);
    const message = error instanceof Error ? error.message : "Erro ao criar convite";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
