import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/guards";
import { z } from "zod";
import { OrganizationStatus } from "@prisma/client";
import { createAuditLog } from "@/lib/audit";

const createOrgSchema = z.object({
    name: z.string().min(2, "Nome é obrigatório"),
    slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Slug inválido"),
    legalName: z.string().optional(),
    vatNumber: z.string().optional(),
    contactEmail: z.string().email("Email inválido").optional().or(z.literal("")),
    status: z.nativeEnum(OrganizationStatus).default(OrganizationStatus.PENDING),
});

export async function GET(req: NextRequest) {
    try {
        const session = await requireAuth();
        if ((session.user as any).role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
        const limit = Math.max(1, parseInt(searchParams.get("limit") || "10"));
        const q = searchParams.get("q") || "";
        const status = searchParams.get("status") as OrganizationStatus | null;

        const skip = (page - 1) * limit;

        const where = {
            AND: [
                q ? {
                    OR: [
                        { name: { contains: q } },
                        { legalName: { contains: q } },
                        { slug: { contains: q } },
                    ]
                } : {},
                status ? { status } : {},
            ],
        };

        const [organizations, total] = await Promise.all([
            prisma.organization.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
                include: {
                    _count: {
                        select: { members: true, events: true }
                    }
                }
            }),
            prisma.organization.count({ where }),
        ]);

        return NextResponse.json({
            organizations,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                page,
                limit,
            }
        });
    } catch (error) {
        console.error("[Admin Organizations GET]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await requireAuth();
        const userId = (session.user as any).id;

        if ((session.user as any).role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const json = await req.json();
        const body = createOrgSchema.parse(json);

        // Check if slug exists
        const existing = await prisma.organization.findUnique({
            where: { slug: body.slug }
        });

        if (existing) {
            return NextResponse.json({ error: "Este slug já está em uso." }, { status: 409 });
        }

        const org = await prisma.organization.create({
            data: {
                name: body.name,
                slug: body.slug,
                legalName: body.legalName,
                vatNumber: body.vatNumber,
                contactEmail: body.contactEmail || null,
                status: body.status,
            }
        });

        await createAuditLog({
            userId,
            action: "org.created",
            entityType: "organization",
            entityId: org.id,
            details: { name: org.name, slug: org.slug },
            ip: req.headers.get("x-forwarded-for") || undefined,
            userAgent: req.headers.get("user-agent") || undefined,
        });

        return NextResponse.json(org, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
        }
        console.error("[Admin Organizations POST]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
