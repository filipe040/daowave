import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sessions = await prisma.userSession.findMany({
      where: { userId: session.user.id },
      orderBy: { lastSeenAt: "desc" },
    });
    return NextResponse.json({
      sessions: sessions.map((s) => ({
        id: s.id,
        ip: s.ip,
        userAgent: s.userAgent,
        createdAt: s.createdAt,
        lastSeenAt: s.lastSeenAt,
        revokedAt: s.revokedAt,
      })),
    });
  } catch (e) {
    const err = e as { message?: string; code?: string };
    const isMissingTable =
      err?.message?.includes("Unknown table") ||
      err?.message?.includes("doesn't exist") ||
      err?.code === "P2021";
    if (isMissingTable) {
      return NextResponse.json({ sessions: [] });
    }
    console.error("[api/account/sessions] GET error:", e);
    return NextResponse.json({ error: "Erro ao carregar sessões" }, { status: 500 });
  }
}
