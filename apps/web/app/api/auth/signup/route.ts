import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { sendTemplate } from "@/lib/email-service";
import { isDisposableEmail } from "@/lib/disposable-email";
import { checkRegisterRateLimit } from "@/lib/rate-limit-email";
import { getEmailConfig } from "@/lib/config/email";
import { applyRateLimit, RATE_LIMITS, safeLog, getRequestMetadata } from "@/lib/security";
import { createAuditLog } from "@/lib/audit";
import { config } from "@/lib/config";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    // Rate limiting
    const rateLimitResponse = await applyRateLimit(req, RATE_LIMITS.auth);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nome, email e palavra-passe são obrigatórios" },
        { status: 400 }
      );
    }

    // Normalize email to lowercase and trim
    const normalizedEmail = email.toLowerCase().trim();

    // Check disposable email
    if (isDisposableEmail(normalizedEmail)) {
      return NextResponse.json(
        { error: "Emails temporários não são permitidos" },
        { status: 400 }
      );
    }

    // Email-specific rate limiting
    const metadata = getRequestMetadata(req);
    const emailRateLimit = await checkRegisterRateLimit(normalizedEmail, metadata.ip || "unknown");
    if (!emailRateLimit.allowed) {
      return NextResponse.json(
        { error: emailRateLimit.reason },
        { status: 429, headers: { "Retry-After": String(emailRateLimit.retryAfter || 3600) } }
      );
    }

    // Check if registration is closed (beta closed)
    if (config.features.closedRegistration) {
      // List of allowed emails during closed beta (can be empty for completely closed)
      const ALLOWED_EMAILS: string[] = [
        // Add specific emails that should be allowed during closed beta
        // Example: "beta@example.com", "test@example.com"
      ];

      if (!ALLOWED_EMAILS.includes(normalizedEmail)) {
        safeLog.info(`Registration attempt blocked (closed beta): ${normalizedEmail}`);
        return NextResponse.json(
          { error: "Registos estão temporariamente fechados. O beta está em modo fechado." },
          { status: 403 }
        );
      }
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "A palavra-passe deve ter pelo menos 6 caracteres" },
        { status: 400 }
      );
    }

    // Check if user already exists (using normalized email)
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Já existe uma conta com este email" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // Create user (using normalized email) with email verification
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash: hashedPassword,
        role: "USER",
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationTokenExpiresAt: expiresAt,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Send verification email using Resend
    let emailSent = false;
    let emailError: string | null = null;
    
    try {
      const emailConfig = getEmailConfig();
      
      safeLog.info("Attempting to send verification email", {
        userId: user.id,
        email: user.email,
        enabled: emailConfig.enabled,
        hasApiKey: !!emailConfig.resendApiKey,
        apiKeyPrefix: emailConfig.resendApiKey ? emailConfig.resendApiKey.substring(0, 10) : 'none',
      });
      
      // Check if emails are enabled and Resend is configured
      if (!emailConfig.enabled) {
        emailError = "Emails are disabled";
        safeLog.warn("Emails are disabled - verification email not sent", {
          userId: user.id,
          email: user.email,
        });
      } else if (!emailConfig.resendApiKey) {
        emailError = "RESEND_API_KEY not configured";
        safeLog.warn("RESEND_API_KEY not configured - verification email not sent", {
          userId: user.id,
          email: user.email,
        });
      } else {
        // Use request URL for verification link (works in dev and production)
        const requestUrl = new URL(req.url);
        const baseUrl = requestUrl.origin;
        // In development, prefer localhost, otherwise use APP_URL
        const verificationBaseUrl = process.env.NODE_ENV === 'development' 
          ? (baseUrl.includes('localhost') ? baseUrl : 'http://localhost:3000')
          : emailConfig.appUrl;
        const verificationUrl = `${verificationBaseUrl}/auth/verify-email?token=${verificationToken}`;

        safeLog.info("Sending verification email", {
          userId: user.id,
          email: user.email,
          verificationUrl: verificationUrl.substring(0, 50) + '...',
        });

        const emailResult = await sendTemplate({
          to: user.email,
          templateId: "verify-email",
          variables: {
            name: user.name || "Utilizador",
            verificationUrl,
            expiresIn: "24 horas",
          },
          idempotencyKey: `verify-${user.id}`,
        });

        if (emailResult.success) {
          emailSent = true;
          safeLog.info(`✅ Verification email sent successfully to ${user.email}`, {
            messageId: emailResult.messageId,
            emailLogId: emailResult.emailLogId,
          });
        } else {
          emailError = emailResult.error || "Unknown error";
          safeLog.error("❌ Failed to send verification email", {
            error: emailResult.error,
            emailLogId: emailResult.emailLogId,
            userId: user.id,
            email: user.email,
          });
        }
      }
    } catch (emailErrorCaught: any) {
      emailError = emailErrorCaught.message || "Unknown error";
      safeLog.error("❌ Exception sending verification email", {
        error: emailErrorCaught.message,
        stack: emailErrorCaught.stack,
        userId: user.id,
        email: user.email,
      });
    }

    // Audit log (reuse metadata from earlier)
    await createAuditLog({
      userId: user.id,
      action: "USER_CREATED",
      entityType: "user",
      entityId: user.id,
      details: {
        email: user.email,
        role: user.role,
      },
      ...metadata,
    });

    safeLog.info(`User created: ${user.id}`, { 
      userId: user.id, 
      email: user.email,
      emailSent 
    });

    // Return response with email status
    if (emailSent) {
      return NextResponse.json(
        { 
          message: "Conta criada com sucesso. Verifique o seu email para ativar a conta.", 
          user,
          emailSent: true 
        },
        { status: 201 }
      );
    } else {
      // Still return success, but warn about email
      return NextResponse.json(
        { 
          message: "Conta criada com sucesso, mas o email de verificação não foi enviado. Por favor, contacte o suporte.",
          user,
          emailSent: false,
          emailError: emailError || "Email não enviado"
        },
        { status: 201 }
      );
    }
  } catch (error: any) {
    safeLog.error("Error creating user", error);
    return NextResponse.json(
      { error: error.message || "Erro ao criar conta" },
      { status: 500 }
    );
  }
}

