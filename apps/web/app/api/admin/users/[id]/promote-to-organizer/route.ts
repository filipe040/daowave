import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const PromoteSchema = z.object({
  brandName: z.string().min(1, "Nome da marca é obrigatório"),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { brandName } = PromoteSchema.parse(body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        promoterProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // Check if already organizer
    if (user.role === "PROMOTER") {
      return NextResponse.json(
        { error: "Usuário já é promotor" },
        { status: 400 }
      );
    }

    // Check if already admin
    if (user.role === "ADMIN") {
      return NextResponse.json(
        { error: "Não é possível promover administradores" },
        { status: 400 }
      );
    }

    // Update user role to PROMOTER
    await prisma.user.update({
      where: { id },
      data: { role: "PROMOTER" },
    });

    // Create or update organizer profile
    if (user.promoterProfile) {
      await prisma.promoterProfile.update({
        where: { id: user.promoterProfile.id },
        data: {
          brandName,
          status: "APPROVED", // Auto-approve when promoted by admin
        },
      });
    } else {
      await prisma.promoterProfile.create({
        data: {
          userId: id,
          brandName,
          status: "APPROVED", // Auto-approve when promoted by admin
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Usuário ${user.email} promovido a promotor com sucesso`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Promote to organizer error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

