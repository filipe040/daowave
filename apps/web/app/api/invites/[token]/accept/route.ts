import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/guards";
import { InviteService } from "@/lib/services/invite.service";
import { createAuditLog } from "@/lib/audit";

/**
 * POST /api/invites/[token]/accept
 * Secure endpoint to accept an invitation. Requires Auth.
 */
export async function POST(
    req: NextRequest,
    context: { params: Promise<{ token: string }> }
) {
    try {
        const params = await context.params;
        const session = await requireAuth();
        const userId = (session.user as any).id;
        const userEmail = session.user.email;

        // 1. Validate Token
        const { valid, invite, error } = await InviteService.validateToken(params.token);

        if (!valid || !invite) {
            return NextResponse.json({ error: error || "Convite inválido" }, { status: 400 });
        }

        // 2. Security Check: Email must match
        if (invite.email.toLowerCase() !== userEmail?.toLowerCase()) {
            console.warn(`[Invite Acceptance] Email mismatch: invited ${invite.email}, but logged in as ${userEmail}`);
            return NextResponse.json({
                error: `Este convite foi enviado para ${invite.email}, mas você está logado como ${userEmail}.`
            }, { status: 403 });
        }

        // 3. atomic transaction: Accept invite + Add member + Upgrade user role if needed
        const result = await prisma.$transaction(async (tx) => {
            // a. Mark invite as accepted
            await (tx as any).invite.update({
                where: { id: invite.id },
                data: {
                    status: "ACCEPTED",
                    acceptedAt: new Date()
                }
            });

            // b. Add member to organization
            const member = await (tx as any).organizationMember.upsert({
                where: {
                    organizationId_userId: {
                        organizationId: invite.organizationId,
                        userId: userId,
                    }
                },
                update: {
                    role: invite.role,
                    status: "ACTIVE"
                },
                create: {
                    organizationId: invite.organizationId,
                    userId: userId,
                    role: invite.role,
                    status: "ACTIVE"
                }
            });

            // c. Upgrade global user role if they are just a USER
            const user = await tx.user.findUnique({ where: { id: userId } });
            if (user?.role === "USER") {
                await tx.user.update({
                    where: { id: userId },
                    data: { role: "PROMOTER" }
                });
            }

            return member;
        });

        await createAuditLog({
            userId,
            organizationId: invite.organizationId,
            action: "invite.accepted",
            entityType: "organization_member",
            entityId: result.id,
            details: { role: invite.role },
            ip: req.headers.get("x-forwarded-for") || undefined,
            userAgent: req.headers.get("user-agent") || undefined,
        });

        return NextResponse.json({ success: true, organizationId: invite.organizationId });
    } catch (error: any) {
        console.error("[Invite Acceptance POST] FATAL ERROR:", error);
        return NextResponse.json({
            error: error.message || "Internal Server Error",
            details: process.env.NODE_ENV === "development" ? error.stack : undefined
        }, { status: 500 });
    }
}
