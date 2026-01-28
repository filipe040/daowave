import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const UpdateProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Nome demasiado curto")
    .max(80, "Nome demasiado longo")
    .nullable()
    .optional(),
});

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const data = UpdateProfileSchema.parse(body);

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: data.name ?? null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
      },
    });

    return NextResponse.json({ user: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message ?? "Dados inválidos" },
        { status: 400 }
      );
    }

    // Se coluna avatarUrl ainda não existir, fazer update sem a selecionar
    if (error?.code === "P2021" || error?.message?.includes("Unknown column")) {
      const updated = await prisma.user.update({
        where: { id: session!.user!.id },
        data: {
          name: (await request.json()).name ?? null,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      return NextResponse.json({ user: { ...updated, avatarUrl: null } });
    }

    console.error("[account-profile] PATCH error:", error);
    return NextResponse.json(
      { error: "Erro interno ao atualizar perfil" },
      { status: 500 }
    );
  }
}

