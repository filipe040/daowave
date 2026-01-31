/**
 * Security utilities
 * Rate limiting, log sanitization, and security helpers
 */

import { rateLimit, getClientIdentifier, RateLimitConfig } from "./rate-limit";
import { createAuditLog as createAuditLogInternal, AuditLogData } from "./audit";

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // Auth endpoints - stricter limits
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
  },
  // Checkout - prevent abuse
  checkout: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 3, // 3 checkouts per minute
  },
  // Resend ticket - prevent spam
  resendTicket: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 resends per hour
  },
  // Validator check-in - high volume but need protection
  validatorCheckin: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 check-ins per minute
  },
  // Promotor check-in (QR verify) - per client
  promotorCheckin: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 120, // 120 verifies per minute per client
  },
  // Admin read (audit-logs, fraud, users/search)
  adminRead: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 reads per minute per client
  },
  // Promotor read (analytics, finance)
  promotorRead: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 reads per minute per client
  },
} as const;

/**
 * Apply rate limiting to a request
 */
export async function applyRateLimit(
  req: Request,
  config: RateLimitConfig
): Promise<Response | null> {
  return rateLimit(config)(req);
}

/**
 * Sanitize sensitive data from logs
 */
export function sanitizeForLog(data: any): any {
  if (!data || typeof data !== "object") {
    return data;
  }

  const sensitiveFields = [
    "password",
    "token",
    "secret",
    "key",
    "qrToken",
    "qrNonce",
    "paymentIntent",
    "paymentRef",
    "cardNumber",
    "cvv",
    "expiry",
    "stripeSecret",
    "webhookSecret",
  ];

  const sanitized = Array.isArray(data) ? [...data] : { ...data };

  for (const key in sanitized) {
    const lowerKey = key.toLowerCase();
    
    // Check if field is sensitive
    if (sensitiveFields.some((field) => lowerKey.includes(field))) {
      if (typeof sanitized[key] === "string" && sanitized[key].length > 0) {
        // Show first 4 and last 4 chars, mask the rest
        const value = sanitized[key];
        if (value.length > 8) {
          sanitized[key] = `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
        } else {
          sanitized[key] = "***";
        }
      } else {
        sanitized[key] = "***";
      }
    } else if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeForLog(sanitized[key]);
    }
  }

  return sanitized;
}

/**
 * Safe logger that sanitizes sensitive data
 */
export const safeLog = {
  info: (message: string, data?: any) => {
    console.log(message, data ? sanitizeForLog(data) : "");
  },
  error: (message: string, error?: any) => {
    const sanitizedError = error
      ? {
          ...error,
          message: error.message,
          stack: error.stack,
        }
      : undefined;
    console.error(message, sanitizedError ? sanitizeForLog(sanitizedError) : "");
  },
  warn: (message: string, data?: any) => {
    console.warn(message, data ? sanitizeForLog(data) : "");
  },
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === "development") {
      console.debug(message, data ? sanitizeForLog(data) : "");
    }
  },
};

/**
 * Get request metadata for audit logs
 */
export function getRequestMetadata(req: Request): {
  ip: string;
  userAgent: string | undefined;
} {
  return {
    ip: getClientIdentifier(req),
    userAgent: req.headers.get("user-agent") || undefined,
  };
}

/**
 * Collect login information from request
 */
export async function collectLoginInfo(req: Request): Promise<{
  ip: string;
  userAgent: string | null;
  timestamp: Date;
}> {
  return {
    ip: getClientIdentifier(req),
    userAgent: req.headers.get("user-agent"),
    timestamp: new Date(),
  };
}

/**
 * Create audit log with sanitized data
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
  // Sanitize details before logging
  const sanitizedData = {
    ...data,
    details: data.details ? sanitizeForLog(data.details) : undefined,
  };
  
  await createAuditLogInternal(sanitizedData);
}
