/**
 * GET /api/admin/users — lista paginada de utilizadores (ADMIN only)
 * Query: page, limit, role?, q? (search by email/nome)
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit, RATE_LIMITS, safeLog } from "@/lib/security";
import type { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    const rateLimitRes = await applyRateLimit(req, RATE_LIMITS.adminRead);
    if (rateLimitRes) return rateLimitRes;

    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
        const roleParam = searchParams.get("role") as Role | null;
        const q = searchParams.get("q")?.trim() ?? "";

        const validRoles: Role[] = ["USER", "PROMOTER", "ADMIN", "VALIDATOR"];
        const roleFilter = roleParam && validRoles.includes(roleParam) ? { role: roleParam } : {};

        const searchFilter = q
            ? {
                OR: [
                    { email: { contains: q } },
                    { name: { contains: q } },
                ],
            }
            : {};

        const where = { ...roleFilter, ...searchFilter };

        const [data, total] = await Promise.all([
            prisma.user.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    emailVerified: true,
                    createdAt: true,
                    _count: { select: { orders: true, tickets: true } },
                },
            }),
            prisma.user.count({ where }),
        ]);

        return NextResponse.json({ data, total, page, limit });
    } catch (error) {
        safeLog.error("Admin users list error", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
