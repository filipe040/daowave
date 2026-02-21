import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit, RATE_LIMITS, safeLog } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * Helper to escape CSV values
 */
function escapeCSV(val: any): string {
    if (val === null || val === undefined) return "";
    const str = typeof val === "object" ? JSON.stringify(val) : String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

export async function GET(req: Request) {
    const rateLimitRes = await applyRateLimit(req, RATE_LIMITS.adminRead);
    if (rateLimitRes) return rateLimitRes;

    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const action = searchParams.get("action") ?? undefined;
        const entityType = searchParams.get("entityType") ?? undefined;
        const orgId = searchParams.get("organizationId") ?? undefined;

        const where = {
            ...(action && { action }),
            ...(entityType && { entityType }),
            ...(orgId && { organizationId: orgId }),
        };

        // Fetch logs (limit to 1000 for safety, could be adjusted)
        const logs = await prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: 1000,
        });

        const headers = ["ID", "Data", "Ordem/Org", "Ator", "Ação", "Entidade", "Entidade ID", "IP", "User Agent", "Meta"];
        const rows = logs.map(log => [
            log.id,
            log.createdAt.toISOString(),
            log.organizationId || "",
            log.actorUserId || "",
            log.action,
            log.entityType,
            log.entityId || "",
            log.ip || "",
            log.userAgent || "",
            JSON.stringify(log.metaJson || {}),
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.map(escapeCSV).join(","))
        ].join("\n");

        return new Response(csvContent, {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`,
            },
        });

    } catch (error) {
        safeLog.error("Export audit-logs error", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
