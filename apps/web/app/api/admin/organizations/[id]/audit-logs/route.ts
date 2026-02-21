import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/guards";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const params = await context.params;
        const session = await requireAuth();
        if ((session.user as any).role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const limit = Math.max(1, parseInt(searchParams.get("limit") || "50"));
        const offset = Math.max(0, parseInt(searchParams.get("offset") || "0"));

        const logs = await prisma.auditLog.findMany({
            where: { organizationId: params.id },
            orderBy: { createdAt: "desc" },
            take: limit,
            skip: offset,
            include: {
                // Option to include actor info if needed, but actorUserId might not even exist in User if external
            }
        });

        return NextResponse.json(logs);
    } catch (error) {
        console.error("[Admin Organization Audit Logs GET]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
