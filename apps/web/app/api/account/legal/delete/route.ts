import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";

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

  const userId = session.user.id;

  try {
    await prisma.$transaction(async (tx) => {
      const anonEmail = `deleted+${crypto.randomUUID()}@anon.livepass.local`;
      const anonName = "Utilizador eliminado";

      await tx.ticket.updateMany({
        where: { userId },
        data: { status: "CANCELLED", qrPayload: "voided" },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          email: anonEmail,
          name: anonName,
          passwordHash: null,
          avatarUrl: null,
          phone: null,
          marketingOptIn: false,
        },
      });
    });

    return NextResponse.json({ success: true, message: "Conta anonimizada com sucesso" });
  } catch (e) {
    console.error("[account-legal-delete] POST error:", e);
    return NextResponse.json({ error: "Erro ao apagar conta. Contacta o suporte." }, { status: 500 });
  }
}
