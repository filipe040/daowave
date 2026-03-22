import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/guards";
import { z } from "zod";
import { OrganizationStatus } from "@prisma/client";
import { createAuditLog } from "@/lib/audit";

const updateOrgSchema = z.object({
    name: z.string().min(2).optional(),
    slug: z
        .string()
        .min(2, "Slug deve ter pelo menos 2 caracteres")
        .max(64, "Slug demasiado longo")
        .regex(/^[a-z0-9-]+$/, "Slug apenas pode conter letras minúsculas, números e hífens")
        .optional(),
    legalName: z.string().optional(),
    vatNumber: z.string().optional(),
    contactEmail: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(),
    address: z.string().optional(),
    country: z.string().optional(),
    website: z.string().optional(),
    logoUrl: z.string().optional(),
    status: z.nativeEnum(OrganizationStatus).optional(),
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

        const org = await (prisma as any).organization.findUnique({
            where: { id: params.id },
            include: {
                _count: {
                    select: { members: true, events: true, invites: true }
                }
            }
        });

        if (!org) {
            return NextResponse.json({ error: "Organização não encontrada" }, { status: 404 });
        }

        return NextResponse.json(org);
    } catch (error) {
        console.error("[Admin Organization Detail GET]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(
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
        const body = updateOrgSchema.parse(json);

        const existing = await prisma.organization.findUnique({
            where: { id: params.id }
        });

        if (!existing) {
            return NextResponse.json({ error: "Organização não encontrada" }, { status: 404 });
        }

        // Check slug uniqueness if slug is being changed
        if (body.slug && body.slug !== existing.slug) {
            const slugTaken = await prisma.organization.findUnique({
                where: { slug: body.slug },
            });
            if (slugTaken) {
                return NextResponse.json(
                    { error: "Este slug já está em uso por outra organização", details: [{ path: ["slug"], message: "Slug já em uso" }] },
                    { status: 409 }
                );
            }
        }

        const updated = await prisma.organization.update({
            where: { id: params.id },
            data: body,
        });

        // Audit log for status changes
        if (body.status && body.status !== existing.status) {
            await createAuditLog({
                userId,
                action: "org.status_changed",
                entityType: "organization",
                entityId: updated.id,
                details: { from: existing.status, to: body.status },
                ip: req.headers.get("x-forwarded-for") || undefined,
                userAgent: req.headers.get("user-agent") || undefined,
            });
        }

        return NextResponse.json(updated);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.errors[0].message, details: error.errors.map(e => ({ path: e.path, message: e.message })) },
                { status: 400 }
            );
        }
        console.error("[Admin Organization Detail PATCH]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
