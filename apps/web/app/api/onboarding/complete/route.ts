import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/guards";
import { z } from "zod";
import { createAuditLog } from "@/lib/audit";

const onboardingSchema = z.object({
    name: z.string().min(2, "Nome é obrigatório"),
    phone: z.string().optional(),
    avatarUrl: z.string().optional(),
    // Organization fields for owners to refine on first login
    organization: z.object({
        id: z.string(),
        name: z.string().optional(),
        website: z.string().optional(),
        logoUrl: z.string().optional(),
    }).optional(),
});

/**
 * POST /api/onboarding/complete
 * Finalize user registration and mark as ready to use.
 */
export async function POST(req: NextRequest) {
    try {
        const session = await requireAuth();
        const userId = (session.user as any).id;

        const json = await req.json();
        const body = onboardingSchema.parse(json);

        // 1. Update User Profile
        await prisma.user.update({
            where: { id: userId },
            data: {
                name: body.name,
                phone: body.phone,
                avatarUrl: body.avatarUrl,
                onboardingComplete: true,
            },
        });

        // 2. If organization details are provided, check if user is OWNER
        if (body.organization) {
            const membership = await prisma.organizationMember.findFirst({
                where: {
                    organizationId: body.organization.id,
                    userId: userId,
                    role: "PROMOTER_OWNER",
                }
            });

            if (membership) {
                await prisma.organization.update({
                    where: { id: body.organization.id },
                    data: {
                        name: body.organization.name,
                        website: body.organization.website,
                        logoUrl: body.organization.logoUrl,
                    }
                });

                await createAuditLog({
                    userId,
                    organizationId: body.organization.id,
                    action: "org.onboarding_updated",
                    entityType: "organization",
                    entityId: body.organization.id,
                    details: { name: body.organization.name },
                    ip: req.headers.get("x-forwarded-for") || undefined,
                    userAgent: req.headers.get("user-agent") || undefined,
                });
            }
        }

        await createAuditLog({
            userId,
            action: "user.onboarding_completed",
            entityType: "user",
            entityId: userId,
            ip: req.headers.get("x-forwarded-for") || undefined,
            userAgent: req.headers.get("user-agent") || undefined,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
        }
        console.error("[Onboarding Completion POST]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
