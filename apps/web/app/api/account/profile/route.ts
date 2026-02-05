import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
  avatarUrl: z.union([z.string().url(), z.literal("")]).nullable().optional(),
  phone: z.string().max(32).nullable().optional().or(z.literal("")),
});

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  try {
    const data = UpdateProfileSchema.parse(body);

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: data.name ?? undefined,
        avatarUrl: data.avatarUrl !== undefined ? (data.avatarUrl || null) : undefined,
        phone: data.phone !== undefined ? (data.phone || null) : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        phone: true,
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
      const data = UpdateProfileSchema.parse(body);

      const updated = await prisma.user.update({
        where: { id: session!.user!.id },
        data: {
          name: data.name ?? null,
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

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        phone: true,
        notifyEmail: true,
        notifyEventReminders: true,
        notifyTransfers: true,
        marketingOptIn: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    const isMissingColumn =
      err?.code === "P2022" ||
      err?.message?.includes("Unknown column") ||
      err?.message?.includes("does not exist");
    if (isMissingColumn) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { id: true, name: true, email: true, role: true, avatarUrl: true },
        });
        return NextResponse.json({
          user: user
            ? { ...user, phone: null, notifyEmail: true, notifyEventReminders: true, notifyTransfers: true, marketingOptIn: false }
            : null,
        });
      } catch {
        // ignore
      }
    }
    console.error("[account-profile] GET error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

