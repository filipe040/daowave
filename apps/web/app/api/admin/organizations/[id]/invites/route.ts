import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/guards";
import { z } from "zod";
import { MemberRole } from "@prisma/client";
import { InviteService } from "@/lib/services/invite.service";
import { createAuditLog } from "@/lib/audit";
import { EmailService } from "@/lib/email-service";

const createInviteSchema = z.object({
    email: z.string().email("Email inválido"),
    role: z.nativeEnum(MemberRole),
    expiresInHours: z.number().int().min(1).max(168).default(48),
});

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

        const invites = await (prisma as any).invite.findMany({
            where: { organizationId: params.id },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(invites);
    } catch (error) {
        console.error("[Admin Invites GET]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const params = await context.params;
        const session = await requireAuth();
        const userId = (session.user as any).id;

        if ((session.user as any).role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const json = await req.json();
        const body = createInviteSchema.parse(json);

        // Ensure org exists
        const org = await prisma.organization.findUnique({
            where: { id: params.id }
        });

        if (!org) {
            return NextResponse.json({ error: "Organização não encontrada" }, { status: 404 });
        }

        // Check for existing pending invite
        const existing = await (prisma as any).invite.findFirst({
            where: {
                organizationId: params.id,
                email: body.email,
                status: "PENDING",
                expiresAt: { gt: new Date() }
            }
        });

        if (existing) {
            return NextResponse.json({ error: "Já existe um convite pendente para este email." }, { status: 409 });
        }

        const { invite, rawToken } = await InviteService.createInvite({
            email: body.email,
            organizationId: params.id,
            role: body.role,
            expiresInHours: body.expiresInHours,
        });

        const inviteLink = `${process.env.APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'}/invites/accept?token=${rawToken}`;

        await createAuditLog({
            userId,
            organizationId: params.id,
            action: "invite.created",
            entityType: "invite",
            entityId: invite.id,
            details: { email: body.email, role: body.role },
            ip: req.headers.get("x-forwarded-for") || undefined,
            userAgent: req.headers.get("user-agent") || undefined,
        });

        // Send invitation email
        try {
            await EmailService.sendTemplate({
                to: body.email,
                templateId: "invite-organization",
                variables: {
                    organizationName: org.name,
                    acceptUrl: inviteLink,
                    expiresIn: `${body.expiresInHours} horas`
                },
                idempotencyKey: `invite-org-${params.id}-${body.email}-${invite.id}`
            });
        } catch (emailError) {
            console.error("[Admin Invites POST] Failed to send email:", emailError);
            // We don't fail the request if email fails, as the link is still returned
        }

        return NextResponse.json({
            ...invite,
            inviteLink,
        }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
        }
        console.error("[Admin Invites POST]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
