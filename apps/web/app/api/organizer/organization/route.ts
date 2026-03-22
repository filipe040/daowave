/**
 * GET /api/organizer/organization - Get current user's organization
 * PUT /api/organizer/organization - Update organization settings
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const UpdateOrgSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  legalName: z.string().optional().nullable(),
  vatNumber: z.string().optional().nullable(),
  contactEmail: z.string().email("Email inválido").optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  website: z.string().url("URL inválida").optional().nullable().or(z.literal("")),
  logoUrl: z.string().optional().nullable(),
});

async function getOrgForUser(userId: string) {
  const member = await prisma.organizationMember.findFirst({
    where: { userId },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });
  return member?.organization || null;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const org = await getOrgForUser(session.user.id);
  if (!org) {
    return NextResponse.json({ error: "Organização não encontrada" }, { status: 404 });
  }

  return NextResponse.json({ organization: org });
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const org = await getOrgForUser(session.user.id);
    if (!org) {
      return NextResponse.json({ error: "Organização não encontrada" }, { status: 404 });
    }

    // Check user is OWNER or ADMIN of the org
    const member = await prisma.organizationMember.findFirst({
      where: { userId: session.user.id, organizationId: org.id },
    });
    if (!member || !["OWNER", "ADMIN"].includes((member as any).role)) {
      return NextResponse.json({ error: "Sem permissões para editar" }, { status: 403 });
    }

    const body = await req.json();
    const data = UpdateOrgSchema.parse(body);

    const updated = await prisma.organization.update({
      where: { id: org.id },
      data: {
        name: data.name,
        legalName: data.legalName || null,
        vatNumber: data.vatNumber || null,
        contactEmail: data.contactEmail || null,
        phone: data.phone || null,
        address: data.address || null,
        country: data.country || null,
        website: data.website || null,
        logoUrl: data.logoUrl || null,
      },
    });

    return NextResponse.json({ success: true, organization: updated });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: err.errors },
        { status: 400 }
      );
    }
    console.error("[PUT /api/organizer/organization]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
