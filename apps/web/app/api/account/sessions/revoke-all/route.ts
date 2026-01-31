import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.userSession.updateMany({
      where: { userId: session.user.id },
      data: { revokedAt: new Date() },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    const err = e as { message?: string; code?: string };
    const isMissingTable =
      err?.message?.includes("Unknown table") ||
      err?.message?.includes("doesn't exist") ||
      err?.code === "P2021";
    if (isMissingTable) {
      return NextResponse.json({ success: true });
    }
    console.error("[api/account/sessions/revoke-all] error:", e);
    return NextResponse.json({ error: "Erro ao terminar sessões" }, { status: 500 });
  }
}
