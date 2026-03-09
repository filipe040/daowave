/**
 * Email Rate Limiting
 * Prevents abuse and ensures deliverability
 */

import { prisma } from "./prisma";
import { getEmailConfig } from "./config/email";
import { getRequestMetadata } from "./security";

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  retryAfter?: number; // seconds
}

/**
 * Check rate limit for email registration
 */
export async function checkRegisterRateLimit(
  email: string,
  ip: string
): Promise<RateLimitResult> {
  const config = getEmailConfig();
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  // Check per email
  // Try to count, but if EmailLog table doesn't exist, allow the request
  let emailAttempts = 0;
  try {
    emailAttempts = await prisma.emailLog.count({
      where: {
        type: "verify-email",
        to: email.toLowerCase().trim(),
        createdAt: { gte: oneHourAgo },
        status: { in: ["SENT", "PENDING"] },
      },
    });
  } catch (error: any) {
    // If EmailLog table doesn't exist, skip rate limiting
    console.warn("EmailLog table not found, skipping email rate limit check:", error.message);
  }

  if (emailAttempts >= config.rateLimits.registerPerHour) {
    return {
      allowed: false,
      reason: `Máximo de ${config.rateLimits.registerPerHour} tentativas por hora por email`,
      retryAfter: 3600,
    };
  }

  // Check per IP
  let ipAttempts = 0;
  try {
    ipAttempts = await prisma.emailLog.count({
      where: {
        type: "verify-email",
        ipAddress: ip,
        createdAt: { gte: oneHourAgo },
        status: { in: ["SENT", "PENDING"] },
      },
    });
  } catch (error: any) {
    console.warn("EmailLog table/IP column not found, skipping IP rate limit check:", error.message);
  }

  if (ipAttempts >= config.rateLimits.registerPerHour) {
    return {
      allowed: false,
      reason: `Máximo de ${config.rateLimits.registerPerHour} tentativas por hora por IP`,
      retryAfter: 3600,
    };
  }

  return { allowed: true };
}

/**
 * Check rate limit for password reset
 */
export async function checkForgotPasswordRateLimit(
  email: string,
  ip: string
): Promise<RateLimitResult> {
  const config = getEmailConfig();
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  // Check per email
  // Try to count, but if EmailLog table doesn't exist, allow the request
  let emailAttempts = 0;
  try {
    emailAttempts = await prisma.emailLog.count({
      where: {
        type: "reset-password",
        to: email.toLowerCase().trim(),
        createdAt: { gte: oneHourAgo },
        status: { in: ["SENT", "PENDING"] },
      },
    });
  } catch (error: any) {
    // If EmailLog table doesn't exist, skip rate limiting
    console.warn("EmailLog table not found, skipping email rate limit check:", error.message);
  }

  if (emailAttempts >= config.rateLimits.forgotPasswordPerHour) {
    return {
      allowed: false,
      reason: `Máximo de ${config.rateLimits.forgotPasswordPerHour} tentativas por hora por email`,
      retryAfter: 3600,
    };
  }

  // Check per IP (10 per hour)
  let ipAttempts = 0;
  try {
    ipAttempts = await prisma.emailLog.count({
      where: {
        type: "reset-password",
        ipAddress: ip,
        createdAt: { gte: oneHourAgo },
        status: { in: ["SENT", "PENDING"] },
      },
    });
  } catch (error: any) {
    console.warn("EmailLog table/IP column not found, skipping IP rate limit check:", error.message);
  }

  if (ipAttempts >= 10) {
    return {
      allowed: false,
      reason: "Máximo de 10 tentativas por hora por IP",
      retryAfter: 3600,
    };
  }

  return { allowed: true };
}

/**
 * Check rate limit for ticket resend
 */
export async function checkResendTicketRateLimit(
  userId: string,
  orderId: string
): Promise<RateLimitResult> {
  const config = getEmailConfig();
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Check per minute per user
  // Try to count, but if EmailLog table doesn't exist, allow the request
  let recentAttempts = 0;
  try {
    recentAttempts = await prisma.emailLog.count({
      where: {
        type: "ticket-delivery",
        relatedUserId: userId,
        createdAt: { gte: oneMinuteAgo },
        status: { in: ["SENT", "PENDING"] },
      },
    });
  } catch (error: any) {
    // If EmailLog table doesn't exist, skip rate limiting
    console.warn("EmailLog table not found, skipping rate limit check:", error.message);
  }

  if (recentAttempts >= config.rateLimits.resendTicketPerMin) {
    return {
      allowed: false,
      reason: `Máximo de ${config.rateLimits.resendTicketPerMin} reenvio por minuto`,
      retryAfter: 60,
    };
  }

  // Check per day per order
  // Try to count, but if EmailLog table doesn't exist, allow the request
  let dailyAttempts = 0;
  try {
    dailyAttempts = await prisma.emailLog.count({
      where: {
        type: "ticket-delivery",
        relatedOrderId: orderId,
        createdAt: { gte: oneDayAgo },
        status: { in: ["SENT", "PENDING"] },
      },
    });
  } catch (error: any) {
    // If EmailLog table doesn't exist, skip rate limiting
    console.warn("EmailLog table not found, skipping rate limit check:", error.message);
  }

  if (dailyAttempts >= config.rateLimits.resendTicketPerDay) {
    return {
      allowed: false,
      reason: `Máximo de ${config.rateLimits.resendTicketPerDay} reenvios por dia por encomenda`,
      retryAfter: 86400,
    };
  }

  return { allowed: true };
}
