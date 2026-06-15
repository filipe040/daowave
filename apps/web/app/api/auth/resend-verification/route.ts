import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendTemplate } from "@/lib/email-service";
import { applyRateLimit, RATE_LIMITS } from "@/lib/security";
import { getAppBaseUrl } from "@/lib/company";
import crypto from "crypto";

export async function POST(req: Request) {
  const rateLimitRes = await applyRateLimit(req, RATE_LIMITS.auth);
  if (rateLimitRes) return rateLimitRes;

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Inicia sessão para reenviar o email" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Utilizador não encontrado" }, { status: 404 });
  }

  if (user.emailVerified) {
    return NextResponse.json({ success: true, message: "Email já verificado" });
  }

  const verificationToken = crypto.randomBytes(32).toString("hex");
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerificationToken: verificationToken },
  });

  const baseUrl = getAppBaseUrl();
  const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${verificationToken}`;

  const result = await sendTemplate({
    to: user.email,
    templateId: "verify-email",
    variables: {
      name: user.name || "Utilizador",
      verificationUrl,
      expiresIn: "24 horas",
    },
    idempotencyKey: `verify-resend-${user.id}-${Date.now()}`,
  });

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || "Não foi possível enviar o email" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
