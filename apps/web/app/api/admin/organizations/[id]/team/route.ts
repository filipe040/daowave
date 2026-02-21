import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/guards";

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await requireAuth();
        if ((session.user as any).role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const members = await prisma.organizationMember.findMany({
            where: { organizationId: params.id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                        onboardingComplete: true,
                        lastLoginAt: true,
                    }
                }
            },
            orderBy: { createdAt: "asc" },
        });

        return NextResponse.json(members);
    } catch (error) {
        console.error("[Admin Organization Team GET]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
