import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const PatchSchema = z.object({
  notifyEmail: z.boolean().optional(),
  notifyEventReminders: z.boolean().optional(),
  notifyTransfers: z.boolean().optional(),
  marketingOptIn: z.boolean().optional(),
});

export async function PATCH(request: Request) {
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

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  try {
    const data: Record<string, boolean> = {};
    if (parsed.data.notifyEmail !== undefined) data.notifyEmail = parsed.data.notifyEmail;
    if (parsed.data.notifyEventReminders !== undefined) data.notifyEventReminders = parsed.data.notifyEventReminders;
    if (parsed.data.notifyTransfers !== undefined) data.notifyTransfers = parsed.data.notifyTransfers;
    if (parsed.data.marketingOptIn !== undefined) data.marketingOptIn = parsed.data.marketingOptIn;

    await prisma.user.update({
      where: { id: session.user.id },
      data,
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[api/account/notifications] PATCH error:", e);
    return NextResponse.json({ error: "Erro ao atualizar preferências" }, { status: 500 });
  }
}
