/**
 * GET /api/promotor/organizations
 * Retorna as organizations disponíveis para o utilizador.
 * - ADMIN: todas as organizations ativas
 * - PROMOTER: orgs onde é OWNER ou MANAGER
 * Resposta: { data: [{ id, name, slug, role }] }
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit, RATE_LIMITS, safeLog } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    const rateLimitRes = await applyRateLimit(req, RATE_LIMITS.promotorRead);
    if (rateLimitRes) return rateLimitRes;

    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        }

        const role = (session.user as { role?: string }).role;
        if (role !== "PROMOTER" && role !== "ADMIN") {
            return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
        }

        // ADMIN: retorna todas as orgs (com indicação de role ADMIN)
        if (role === "ADMIN") {
            const allOrgs = await prisma.organization.findMany({
                select: { id: true, name: true, slug: true },
                orderBy: { name: "asc" },
            });
            const data = allOrgs.map((o) => ({
                id: o.id,
                name: o.name,
                slug: o.slug,
                role: "ADMIN" as string,
            }));
            return NextResponse.json({ data });
        }

        // PROMOTER: retorna orgs onde é OWNER ou MANAGER
        const memberships = await prisma.organizationMember.findMany({
            where: {
                userId: session.user.id,
                role: { in: ["OWNER", "MANAGER"] },
            },
            select: {
                role: true,
                organization: {
                    select: { id: true, name: true, slug: true },
                },
            },
            orderBy: { organization: { name: "asc" } },
        });

        const data = memberships.map((m) => ({
            id: m.organization.id,
            name: m.organization.name,
            slug: m.organization.slug,
            role: m.role,
        }));

        return NextResponse.json({ data });
    } catch (error) {
        safeLog.error("Promotor organizations error", error);
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}
