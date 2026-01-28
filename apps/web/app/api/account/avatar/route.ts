import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Ficheiro não fornecido" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de ficheiro inválido. Use PNG, JPG ou WEBP." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Ficheiro demasiado grande (máx. 5MB)." },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    const uploadsDir = join(
      process.cwd(),
      "public",
      "uploads",
      "avatars",
      userId
    );

    await mkdir(uploadsDir, { recursive: true });

    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const filename = `${timestamp}-${sanitizedName}`;
    const filePath = join(uploadsDir, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const avatarUrl = `/uploads/avatars/${userId}/${filename}`;

    try {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatarUrl: true,
        },
      });

      return NextResponse.json({ user: updated, avatarUrl });
    } catch (error: any) {
      // Se coluna avatarUrl ainda não existir
      if (error?.code === "P2021" || error?.message?.includes("Unknown column")) {
        // Apenas devolver URL, sem tentar gravar na BD
        return NextResponse.json(
          {
            avatarUrl,
            warning:
              "Campo avatarUrl ainda não existe na base de dados. Execute a migração do Prisma para persistir a foto de perfil.",
          },
          { status: 200 }
        );
      }

      throw error;
    }
  } catch (error) {
    console.error("[account-avatar] POST error:", error);
    return NextResponse.json(
      { error: "Erro interno ao atualizar foto de perfil" },
      { status: 500 }
    );
  }
}

