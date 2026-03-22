/**
 * Server-side environment variables with validation
 * 
 * CRITICAL: This module uses Node.js APIs (process.argv, process.exit)
 * - Use ONLY in server-side code (API routes, server components, etc.)
 * - NEVER import in Edge Runtime (middleware, Edge functions)
 * - Use lib/env.edge.ts for Edge Runtime
 */

import { z } from "zod";

/**
 * Environment variables schema with validation
 * Fails fast if required variables are missing or invalid
 */
const envSchema = z.object({
  // Environment
  NODE_ENV: z.enum(["development", "staging", "production"]).default("development"),

  // Database
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid PostgreSQL URL"),
  DIRECT_URL: z.string().url("DIRECT_URL must be a valid PostgreSQL URL").optional(),

  // Authentication
  NEXTAUTH_SECRET: z.string().min(32, "NEXTAUTH_SECRET must be at least 32 characters").optional(),
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL").optional(),

  // QR Security
  QR_SECRET: z.string().min(32, "QR_SECRET must be at least 32 characters"),

  // Storage (S3 Compatible)
  STORAGE_ENDPOINT: z.string().url("STORAGE_ENDPOINT must be a valid URL").optional(),
  STORAGE_ACCESS_KEY: z.string().optional(),
  STORAGE_SECRET_KEY: z.string().optional(),
  STORAGE_BUCKET: z.string().optional(),

  // Email (SMTP - Legacy)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_SECURE: z.string().optional(),
  SMTP_USER: z.string().email().optional(),
  SMTP_PASS: z.string().optional(),
  
  // Email Provider (Resend)
  RESEND_API_KEY: z.string().optional(), // Resend API key (re_...)
  EMAIL_FROM: z.string().default("DãoWave <no-reply@daowave.pt>"), // From address with display name
  EMAIL_REPLY_TO: z.string().email().optional(), // Reply-to address (defaults to EMAIL_FROM if not set)
  
  // Application URL
  APP_URL: z.string().url().optional(), // Base URL for links in emails
  
  // Email Controls
  EMAILS_ENABLED: z.string().transform((val) => val === "true").default("true"),
  EMAILS_MODE: z.enum(["public_beta", "production"]).default("public_beta"),
  
  // Rate Limiting
  EMAIL_RATE_LIMIT_REGISTER_PER_HOUR: z.string().transform(Number).default("3"),
  EMAIL_RATE_LIMIT_FORGOT_PASSWORD_PER_HOUR: z.string().transform(Number).default("3"),
  EMAIL_RATE_LIMIT_RESEND_TICKET_PER_MIN: z.string().transform(Number).default("1"),
  EMAIL_RATE_LIMIT_RESEND_TICKET_PER_DAY: z.string().transform(Number).default("5"),
  
  // Legacy (deprecated, use RESEND_API_KEY)
  EMAIL_PROVIDER_KEY: z.string().optional(), // Resend (re_...) or SendGrid (SG....)
  
  // Beta Email Controls (deprecated, use EMAILS_MODE)
  BETA_EMAILS_ENABLED: z.string().transform((val) => val === "true").default("false"),
  BETA_EMAIL_ALLOWLIST: z.string().optional(), // Comma-separated list of allowed emails

  // Payments
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  MBWAY_API_KEY: z.string().optional(),
  MULTIBANCO_API_KEY: z.string().optional(),
  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_CLIENT_SECRET: z.string().optional(),

  // Feature Flags
  ENABLE_MOCK_PAYMENTS: z.string().transform((val) => val === "true").default("true"),
  ENABLE_REAL_PAYMENTS: z.string().transform((val) => val === "true").default("false"),
  ENABLE_REAL_EMAILS: z.string().transform((val) => val === "true").default("false"),
  SHOW_BETA_BANNER: z.string().transform((val) => val === "true").default("false"),
  BETA_CLOSED_REGISTRATION: z.string().transform((val) => val === "true").default("false"),

  // Observability
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENV: z.enum(["development", "staging", "production"]).optional(),

  // Security
  RATE_LIMIT_REQUESTS_PER_MINUTE: z.string().transform(Number).default("60"),
  CORS_ORIGINS: z.string().default(
    process.env.NODE_ENV === "production"
      ? (
          process.env.APP_URL ??
          process.env.NEXT_PUBLIC_APP_URL ??
          process.env.NEXTAUTH_URL ??
          ""
        )
      : "http://localhost:3000"
  ),

  // Application
  APP_NAME: z.string().default("GoPass"),
  SUPPORT_EMAIL: z.string().email().optional(),
});

/**
 * Validated environment variables (Server-side only)
 * Throws error on startup if validation fails
 * 
 * NOTE: During prisma generate, DATABASE_URL is not required.
 * Only runtime-required variables will cause build to fail.
 */
export const env = (() => {
  // Fix NEXTAUTH_URL if it's missing protocol
  if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.match(/^https?:\/\//)) {
    // If it looks like a domain, add https://
    if (process.env.NEXTAUTH_URL.includes('.')) {
      process.env.NEXTAUTH_URL = `https://${process.env.NEXTAUTH_URL.replace(/^https?:\/\//, '')}`;
    } else {
      // If it's not a valid URL, use localhost default
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
    }
  }
  
  // Set defaults if not provided
  if (!process.env.NEXTAUTH_URL) {
    process.env.NEXTAUTH_URL = process.env.NODE_ENV === 'production' 
      ? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
      : 'http://localhost:3000';
  }
  
  if (!process.env.NEXTAUTH_SECRET) {
    process.env.NEXTAUTH_SECRET = 'dev-secret-key-change-in-production-12345678901234567890';
  }
  
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Check if we're in build phase (Edge-safe, no process.argv)
      // CRITICAL: Use ONLY NEXT_PHASE env var - no process.argv (not available in Edge Runtime)
      const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build" || 
                           process.env.NEXT_PHASE === "phase-development-build" ||
                           process.env.NEXT_PHASE === "phase-export";
      
      // During build phase, some variables can be optional
      if (isBuildPhase) {
        // Filter out errors for variables that can be optional during build
        // CRITICAL: REDIS_URL e KV_URL não são obrigatórias durante build (Redis é opcional)
        const buildOptionalVars = ["DATABASE_URL", "DIRECT_URL", "NEXTAUTH_SECRET", "NEXTAUTH_URL", "QR_SECRET", "REDIS_URL", "KV_URL"];
        const criticalErrors = error.errors.filter((err) => {
          const path = err.path.join(".");
          return !buildOptionalVars.includes(path);
        });
        
        if (criticalErrors.length > 0) {
          console.warn("⚠️  Environment variable validation failed (critical variables):");
          criticalErrors.forEach((err) => {
            console.warn(`   ${err.path.join(".")}: ${err.message}`);
          });
          console.warn("\n💡 Continuing build with optional variables...");
          console.warn("💡 These variables will be required at runtime.\n");
          // During build, don't throw - just warn
          // Variables will be validated at runtime
        }
        
        // Return env with build-optional variables as optional
        // CRITICAL: REDIS_URL não é obrigatória durante build (Redis é opcional)
        const buildEnvSchema = envSchema.extend({
          DATABASE_URL: z.string().url().optional(),
          DIRECT_URL: z.string().url().optional(),
          NEXTAUTH_SECRET: z.string().min(32).optional(),
          NEXTAUTH_URL: z.string().url().optional(),
          QR_SECRET: z.string().min(32).optional(),
          REDIS_URL: z.string().url().optional(),
          KV_URL: z.string().url().optional(),
        });
        
        return buildEnvSchema.parse(process.env);
      }
      
      // Normal validation for runtime
      console.error("❌ Environment variable validation failed:");
      error.errors.forEach((err) => {
        console.error(`   ${err.path.join(".")}: ${err.message}`);
      });
      console.error("\n💡 Please check your .env file and ensure all required variables are set.");
      console.error("💡 See .env.example for reference.\n");
      // CRITICAL: Don't use process.exit - throw error instead (safer for serverless)
      // process.exit is not available in Edge Runtime and can cause issues
    }
    throw error;
  }
})();

/**
 * Environment helpers
 */
export const isDevelopment = env.NODE_ENV === "development";
export const isStaging = env.NODE_ENV === "staging";
export const isProduction = env.NODE_ENV === "production";

/**
 * Feature flags
 */
export const featureFlags = {
  mockPayments: env.ENABLE_MOCK_PAYMENTS,
  realPayments: env.ENABLE_REAL_PAYMENTS,
  realEmails: env.ENABLE_REAL_EMAILS,
  betaBanner: env.SHOW_BETA_BANNER,
  closedRegistration: env.BETA_CLOSED_REGISTRATION,
} as const;

/**
 * Storage configuration
 */
export const storageConfig = {
  endpoint: env.STORAGE_ENDPOINT,
  accessKey: env.STORAGE_ACCESS_KEY,
  secretKey: env.STORAGE_SECRET_KEY,
  bucket: env.STORAGE_BUCKET,
  enabled: Boolean(
    env.STORAGE_ENDPOINT &&
    env.STORAGE_ACCESS_KEY &&
    env.STORAGE_SECRET_KEY &&
    env.STORAGE_BUCKET
  ),
} as const;

/**
 * Email configuration
 */
export const emailConfig = {
  smtp: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ? parseInt(env.SMTP_PORT) : undefined,
    secure: env.SMTP_SECURE === "true",
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
  providerKey: env.EMAIL_PROVIDER_KEY,
  enabled: Boolean(
    (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) ||
    env.EMAIL_PROVIDER_KEY
  ),
} as const;

/**
 * Payment configuration
 */
export const paymentConfig = {
  stripe: {
    secretKey: env.STRIPE_SECRET_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
    enabled: Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_SECRET_KEY.startsWith("sk_")),
  },
  mbway: {
    apiKey: env.MBWAY_API_KEY,
    enabled: Boolean(env.MBWAY_API_KEY),
  },
  multibanco: {
    apiKey: env.MULTIBANCO_API_KEY,
    enabled: Boolean(env.MULTIBANCO_API_KEY),
  },
  paypal: {
    clientId: env.PAYPAL_CLIENT_ID,
    clientSecret: env.PAYPAL_CLIENT_SECRET,
    enabled: Boolean(env.PAYPAL_CLIENT_ID && env.PAYPAL_CLIENT_SECRET),
  },
} as const;
