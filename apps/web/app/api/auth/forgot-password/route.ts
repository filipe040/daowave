import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EmailService } from "@/lib/email-service";
import { checkForgotPasswordRateLimit } from "@/lib/rate-limit-email";
import { getEmailConfig } from "@/lib/config/email";
import { applyRateLimit, RATE_LIMITS, safeLog, getRequestMetadata } from "@/lib/security";
import { createAuditLog } from "@/lib/audit";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    // Rate limiting
    const rateLimitResponse = await applyRateLimit(req, RATE_LIMITS.auth);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Get request metadata once
    const metadata = getRequestMetadata(req);

    // Email-specific rate limiting
    const emailRateLimit = await checkForgotPasswordRateLimit(normalizedEmail, metadata.ip || "unknown");
    if (!emailRateLimit.allowed) {
      return NextResponse.json(
        { error: emailRateLimit.reason },
        { status: 429 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json(
        { message: "Se o email existir, enviaremos instruções para recuperar a palavra-passe" },
        { status: 200 }
      );
    }

    // TODO: Add passwordResetToken and passwordResetTokenExpiresAt fields to User model
    // Generate reset token and save to DB
    // const resetToken = crypto.randomBytes(32).toString("hex");
    // const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h
    // await prisma.user.update({
    //   where: { id: user.id },
    //   data: {
    //     passwordResetToken: resetToken,
    //     passwordResetTokenExpiresAt: expiresAt,
    //   },
    // });

    // Generate reset URL
    // const emailConfig = getEmailConfig();
    // const resetUrl = `${emailConfig.appUrl}/auth/reset-password?token=${resetToken}`;

    // TODO: Uncomment when password reset fields are added to User model
    // Send email using EmailService
    // EmailService.sendTemplate({
    //   to: user.email,
    //   templateId: "reset-password",
    //   variables: {
    //     name: user.name || "Utilizador",
    //     resetUrl,
    //     expiresIn: "1 hora",
    //   },
    //   idempotencyKey: `reset-${user.id}-${Date.now()}`,
    // }).catch((error) => {
    //   safeLog.error("Error sending password reset email", error);
    // });

    // Audit log (only if user exists)
    await createAuditLog({
      userId: user.id,
      action: "PASSWORD_RESET_REQUESTED",
      resourceType: "user",
      resourceId: user.id,
      details: {
        email: user.email,
      },
      ipAddress: metadata.ip,
      userAgent: metadata.userAgent || undefined,
    });

    safeLog.info(`Password reset requested for user: ${user.id}`);

    return NextResponse.json(
      { message: "Se o email existir, enviaremos instruções para recuperar a palavra-passe" },
      { status: 200 }
    );
  } catch (error) {
    safeLog.error("Error processing forgot password", error);
    return NextResponse.json(
      { error: "Erro ao processar solicitação" },
      { status: 500 }
    );
  }
}

