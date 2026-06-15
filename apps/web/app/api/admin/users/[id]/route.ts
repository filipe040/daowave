/**
 * GET  /api/admin/users/[id] — detalhe do utilizador (sem password)
 * PATCH /api/admin/users/[id] — alterar role (ban/promote) com audit log
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit, RATE_LIMITS, safeLog, createAuditLog } from "@/lib/security";
import { z } from "zod";
import type { Role } from "@prisma/client";
import { canAccessAdminSupport, canManageAdminUsers } from "@/lib/auth/admin-access";

export const dynamic = "force-dynamic";

const VALID_ROLES: Role[] = ["USER", "ADMIN", "FINANCE_MANAGER", "SUPPORT_AGENT"];

const UpdateUserSchema = z.object({
  role: z.enum(["USER", "ADMIN", "FINANCE_MANAGER", "SUPPORT_AGENT"] as [Role, ...Role[]]).optional(),
  /** Banir = forçar role a USER e invalidar sessões */
  banned: z.boolean().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitRes = await applyRateLimit(req, RATE_LIMITS.adminRead);
  if (rateLimitRes) return rateLimitRes;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !canAccessAdminSupport((session.user as { role?: string }).role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        promoterProfile: true,
        _count: { select: { orders: true, tickets: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    safeLog.error("Admin user get error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Stricter rate limit for mutating admin actions
  const rateLimitRes = await applyRateLimit(req, RATE_LIMITS.adminRead);
  if (rateLimitRes) return rateLimitRes;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !canManageAdminUsers((session.user as { role?: string }).role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Prevent self-modification
    if (id === (session.user as { id: string }).id) {
      return NextResponse.json({ error: "Não pode alterar a sua própria conta" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = UpdateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validação inválida", details: parsed.error.errors }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ error: "Utilizador não encontrado" }, { status: 404 });
    }

    const { role, banned } = parsed.data;
    const newRole: Role = banned ? "USER" : (role ?? target.role);

    if (!VALID_ROLES.includes(newRole)) {
      return NextResponse.json({ error: "Role inválido" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role: newRole },
      select: { id: true, email: true, role: true },
    });

    const actionLabel = banned
      ? "admin.user.ban"
      : role
        ? "admin.user.role_change"
        : "admin.user.update";

    await createAuditLog({
      userId: (session.user as { id: string }).id,
      action: actionLabel,
      entityType: "user",
      entityId: id,
      details: {
        previousRole: target.role,
        newRole,
        banned: banned ?? false,
        targetEmail: target.email,
      },
    });

    safeLog.info(`[admin.user.patch] ${actionLabel} → ${id} by ${session.user.email}`);

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validação inválida", details: error.errors }, { status: 400 });
    }
    safeLog.error("Admin user patch error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
