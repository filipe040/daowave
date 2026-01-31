import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit, RATE_LIMITS } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const rateLimitRes = await applyRateLimit(req, RATE_LIMITS.adminRead);
  if (rateLimitRes) return rateLimitRes;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Try exact match first
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        promoterProfile: {
          select: {
            id: true,
            brandName: true,
            status: true,
          },
        },
      },
    });

    // If not found, try case-insensitive search
    if (!user) {
      const users = await prisma.user.findMany({
        where: {
          email: {
            contains: normalizedEmail,
          },
        },
        include: {
          promoterProfile: {
            select: {
              id: true,
              brandName: true,
              status: true,
            },
          },
        },
        take: 1,
      });

      user = users[0] || null;
    }

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
          promoterProfile: user.promoterProfile,
      },
    });
  } catch (error) {
    console.error("Search user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

