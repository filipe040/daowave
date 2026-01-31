import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  confirm: z.literal("APAGAR CONTA"),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
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
      { error: "Confirmação obrigatória: escreve exatamente 'APAGAR CONTA'" },
      { status: 400 }
    );
  }

  try {
    await prisma.user.delete({
      where: { id: session.user.id },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[account-legal-delete] POST error:", e);
    return NextResponse.json({ error: "Erro ao apagar conta" }, { status: 500 });
  }
}
