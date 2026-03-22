/**
 * Email Configuration Module
 * Centralized email configuration with validation
 */

import { z } from "zod";
import { env } from "../env.server";

/**
 * Email configuration schema
 */
const emailConfigSchema = z.object({
  resendApiKey: z.string().min(1, "RESEND_API_KEY is required when EMAILS_ENABLED=true"),
  from: z.string().min(1, "EMAIL_FROM is required"),
  replyTo: z.string().email().optional(),
  appUrl: z.string().url(),
  enabled: z.boolean(),
  mode: z.enum(["public_beta", "production"]),
  rateLimits: z.object({
    registerPerHour: z.number().min(1),
    forgotPasswordPerHour: z.number().min(1),
    resendTicketPerMin: z.number().min(1),
    resendTicketPerDay: z.number().min(1),
  }),
});

export type EmailConfig = z.infer<typeof emailConfigSchema>;

/**
 * Get email configuration
 * Validates and returns email config, throws if invalid
 */
export function getEmailConfig(): EmailConfig {
  // Use RESEND_API_KEY if available, fallback to EMAIL_PROVIDER_KEY for backward compatibility
  let resendApiKey = env.RESEND_API_KEY || (env.EMAIL_PROVIDER_KEY?.startsWith("re_") ? env.EMAIL_PROVIDER_KEY : undefined);

  // Clean API key: remove quotes, trim whitespace
  if (resendApiKey) {
    resendApiKey = resendApiKey.trim().replace(/^["']|["']$/g, '');
  }

  if (env.EMAILS_ENABLED && !resendApiKey) {
    throw new Error(
      "RESEND_API_KEY is required when EMAILS_ENABLED=true. " +
      "Please set RESEND_API_KEY in your environment variables."
    );
  }

  // Validate API key format
  if (resendApiKey && !resendApiKey.startsWith('re_')) {
    console.warn(`⚠️  RESEND_API_KEY não começa com "re_". Valor: ${resendApiKey.substring(0, 10)}...`);
  }

  // Resolve application base URL for links in emails
  const baseUrl =
    process.env.APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXTAUTH_URL;

  if (!baseUrl) {
    throw new Error("APP_URL is not defined");
  }

  const appUrl = baseUrl;

  try {
    // Clean API key: remove quotes and trim whitespace
    const cleanApiKey = resendApiKey
      ? resendApiKey.trim().replace(/^["']|["']$/g, '')
      : "";

    return emailConfigSchema.parse({
      resendApiKey: cleanApiKey,
      from: env.EMAIL_FROM || "GoPass <no-reply@gopass.pt>",
      replyTo: env.EMAIL_REPLY_TO,
      appUrl,
      enabled: env.EMAILS_ENABLED,
      mode: env.EMAILS_MODE,
      rateLimits: {
        registerPerHour: env.EMAIL_RATE_LIMIT_REGISTER_PER_HOUR,
        forgotPasswordPerHour: env.EMAIL_RATE_LIMIT_FORGOT_PASSWORD_PER_HOUR,
        resendTicketPerMin: env.EMAIL_RATE_LIMIT_RESEND_TICKET_PER_MIN,
        resendTicketPerDay: env.EMAIL_RATE_LIMIT_RESEND_TICKET_PER_DAY,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Email configuration validation failed:");
      error.errors.forEach((err) => {
        console.error(`   ${err.path.join(".")}: ${err.message}`);
      });
      throw new Error("Email configuration validation failed");
    }
    throw error;
  }
}

/**
 * Mask email for logging (protect PII)
 */
export function maskEmail(email: string): string {
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return "***@***";

  const maskedLocal = localPart.length > 2
    ? `${localPart[0]}${"*".repeat(Math.min(localPart.length - 2, 3))}${localPart[localPart.length - 1]}`
    : "**";

  const [domainName, ...domainParts] = domain.split(".");
  const maskedDomain = domainName.length > 2
    ? `${domainName[0]}${"*".repeat(Math.min(domainName.length - 2, 3))}${domainName[domainName.length - 1]}`
    : "***";

  return `${maskedLocal}@${maskedDomain}.${domainParts.join(".")}`;
}

/**
 * Hash email for EmailLog (one-way hash, cannot reverse)
 */
export async function hashEmail(email: string): Promise<string> {
  const crypto = await import("crypto");
  return crypto.createHash("sha256").update(email.toLowerCase().trim()).digest("hex");
}
