import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    // Rate limiting
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "unknown";
    const rateLimitResult = checkRateLimit(`reset-password:${clientIP}`, {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5, // 5 requests per 15 minutes
    });
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Muitas tentativas. Por favor, tente novamente mais tarde." },
        { status: 429 }
      );
    }

    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token e palavra-passe são obrigatórios" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "A palavra-passe deve ter pelo menos 6 caracteres" },
        { status: 400 }
      );
    }

    // TODO: Add passwordResetToken and passwordResetTokenExpiresAt fields to User model
    // Find user by token
    // const user = await prisma.user.findUnique({
    //   where: { passwordResetToken: token },
    // });

    // if (!user) {
    //   return NextResponse.json(
    //     { error: "Token inválido ou expirado" },
    //     { status: 400 }
    //   );
    // }

    // if (!user.passwordResetTokenExpiresAt || user.passwordResetTokenExpiresAt < new Date()) {
    //   return NextResponse.json(
    //     { error: "Token expirado" },
    //     { status: 400 }
    //   );
    // }

    // Hash new password
    // const hashedPassword = await bcrypt.hash(password, 10);

    // Update password and invalidate token
    // await prisma.user.update({
    //   where: { id: user.id },
    //   data: {
    //     passwordHash: hashedPassword,
    //     passwordResetToken: null,
    //     passwordResetTokenExpiresAt: null,
    //   },
    // });

    return NextResponse.json(
      { error: "Funcionalidade de reset de password não disponível. Campos não existem no schema." },
      { status: 501 }
    );
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json(
      { error: "Erro ao redefinir palavra-passe" },
      { status: 500 }
    );
  }
}

