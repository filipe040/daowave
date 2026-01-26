import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// CRITICAL: Dynamic imports to prevent build-time execution
// Health check should be lightweight and not depend on heavy initialization

/**
 * Health check endpoint
 * Returns status of critical services
 * CRITICAL: This endpoint does NOT call init() to avoid Redis connection attempts
 * It performs lightweight checks only
 */
export async function GET() {
  // CRITICAL: Do NOT call init() here - it would trigger Redis connection
  // Health check should be lightweight and fast

  // CRITICAL: Dynamic imports to prevent build-time execution
  const { config } = await import("@/lib/config");
  
  const checks: {
    status: "ok" | "degraded";
    timestamp: string;
    environment: string;
    services: {
      database: {
        status: "ok" | "error" | "unknown";
        latency: number;
      };
      storage: {
        status: string;
        latency?: number;
        error?: string;
      };
      email: {
        status: string;
        latency?: number;
        error?: string;
      };
      payments: {
        stripe: boolean;
        mock: boolean;
      };
      redis: {
        status: string;
        enabled: boolean;
      };
    };
  } = {
    status: "ok" as const,
    timestamp: new Date().toISOString(),
    environment: config.env.name,
    services: {
      database: {
        status: "unknown" as const,
        latency: 0,
      },
      storage: {
        status: config.storage.enabled ? "enabled" : "disabled",
      },
      email: {
        status: config.email.enabled ? "enabled" : "disabled",
      },
      payments: {
        stripe: config.payments.stripe.enabled,
        mock: config.payments.mock.enabled,
      },
      redis: {
        status: process.env.REDIS_URL ? "enabled" : "disabled",
        enabled: Boolean(process.env.REDIS_URL),
      },
    },
  };

  // Check database connection
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;
    checks.services.database = {
      status: "ok",
      latency,
    };
  } catch (error) {
    checks.services.database = {
      status: "error",
      latency: 0,
    };
    checks.status = "degraded";
  }

  // Check storage (if enabled)
  if (config.storage.enabled) {
    try {
      const { getS3Client } = await import("@/lib/storage");
      const s3Client = getS3Client();
      if (s3Client) {
        // Try to list buckets (lightweight operation)
        const start = Date.now();
        // For S3-compatible storage, we'll just check if client is available
        // In production, you might want to do a more thorough check
        checks.services.storage = {
          status: "ok",
          latency: Date.now() - start,
        };
      } else {
        checks.services.storage = {
          status: "error",
          error: "S3 client not initialized",
        };
        checks.status = "degraded";
      }
    } catch (error: any) {
      checks.services.storage = {
        status: "error",
        error: error.message,
      };
      checks.status = "degraded";
      const { logger } = await import("@/lib/logger");
      logger.error("Storage health check failed", error);
    }
  }

  // Check email (if enabled)
  if (config.email.enabled) {
    try {
      const { getEmailConfig } = await import("@/lib/config/email");
      const emailConfig = getEmailConfig();
      if (emailConfig.resendApiKey) {
        // For Resend, we just check if API key is configured
        // In production, you might want to do a test API call
        checks.services.email = {
          status: "ok",
          latency: 0,
        };
      } else {
        checks.services.email = {
          status: "error",
          error: "Resend API key not configured",
        };
        checks.status = "degraded";
      }
    } catch (error: any) {
      checks.services.email = {
        status: "error",
        error: error.message,
      };
      checks.status = "degraded";
      const { logger } = await import("@/lib/logger");
      logger.error("Email health check failed", error);
    }
  }

  const statusCode = checks.status === "ok" ? 200 : 503;

  return NextResponse.json(checks, { status: statusCode });
}

