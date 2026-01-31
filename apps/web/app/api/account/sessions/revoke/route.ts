import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const BodySchema = z.object({ sessionId: z.string().uuid() });

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "sessionId inválido" },
      { status: 400 }
    );
  }

  try {
    const userSession = await prisma.userSession.findFirst({
      where: { id: parsed.data.sessionId, userId: session.user.id },
    });
    if (!userSession) {
      return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 });
    }
    await prisma.userSession.update({
      where: { id: parsed.data.sessionId },
      data: { revokedAt: new Date() },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[api/account/sessions/revoke] error:", e);
    return NextResponse.json({ error: "Erro ao revogar sessão" }, { status: 500 });
  }
}
