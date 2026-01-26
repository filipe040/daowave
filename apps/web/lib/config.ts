/**
 * Application configuration based on environment
 * Centralized config management for different environments
 * 
 * CRITICAL: This module imports env.server.ts which uses Node.js APIs
 * - Do NOT import in Edge Runtime (middleware, Edge functions)
 * - Use lib/env.edge.ts for Edge Runtime
 */

// CRITICAL: Dynamic import check to prevent Edge Runtime issues
// env.server.ts uses process.argv/process.exit which are not available in Edge
import { env, isDevelopment, isStaging, isProduction } from "./env.server";

export const config = {
  // Environment
  env: {
    isDevelopment,
    isStaging,
    isProduction,
    name: env.NODE_ENV,
  },

  // Application
  app: {
    name: env.APP_NAME,
    url: env.NEXTAUTH_URL,
    supportEmail: env.SUPPORT_EMAIL,
  },

  // Database
  database: {
    url: env.DATABASE_URL,
  },

  // Authentication
  auth: {
    secret: env.NEXTAUTH_SECRET,
    url: env.NEXTAUTH_URL,
  },

  // Security
  security: {
    qrSecret: env.QR_SECRET,
    rateLimit: {
      requestsPerMinute: env.RATE_LIMIT_REQUESTS_PER_MINUTE,
    },
    cors: {
      origins: env.CORS_ORIGINS ? env.CORS_ORIGINS.split(",").map((origin) => origin.trim()) : [],
    },
  },

  // Storage
  storage: {
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
  },

  // Email
  email: {
    smtp: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ? parseInt(env.SMTP_PORT) : 587,
      secure: env.SMTP_SECURE === "true",
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    providerKey: env.EMAIL_PROVIDER_KEY,
    from: env.EMAIL_FROM,
    enabled: Boolean(
      (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) ||
      env.EMAIL_PROVIDER_KEY
    ),
    beta: {
      enabled: env.BETA_EMAILS_ENABLED,
      allowlist: env.BETA_EMAIL_ALLOWLIST?.split(",").map((e) => e.trim()) || [],
    },
  },

  // Payments
  payments: {
    stripe: {
      secretKey: env.STRIPE_SECRET_KEY,
      webhookSecret: env.STRIPE_WEBHOOK_SECRET,
      enabled: Boolean(
        env.STRIPE_SECRET_KEY &&
        env.STRIPE_SECRET_KEY.startsWith("sk_") &&
        !env.STRIPE_SECRET_KEY.includes("placeholder")
      ),
      // In staging, force test mode even if live key is provided
      testMode: isStaging || (env.STRIPE_SECRET_KEY?.startsWith("sk_test_") ?? false),
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
    mock: {
      enabled: env.ENABLE_MOCK_PAYMENTS,
    },
  },

  // Feature Flags
  features: {
    mockPayments: env.ENABLE_MOCK_PAYMENTS,
    realPayments: env.ENABLE_REAL_PAYMENTS,
    realEmails: env.ENABLE_REAL_EMAILS,
    // Show beta banner automatically in staging, or if explicitly enabled
    betaBanner: isStaging || env.SHOW_BETA_BANNER,
    // Closed registration for beta (only allow specific emails or admins)
    closedRegistration: env.BETA_CLOSED_REGISTRATION,
  },

  // Observability
  observability: {
    sentry: {
      dsn: env.SENTRY_DSN,
      environment: env.SENTRY_ENV || env.NODE_ENV,
      enabled: Boolean(env.SENTRY_DSN),
    },
  },
} as const;

// Export public config for client-side use
export const publicConfig = {
  showBetaBanner: process.env.NEXT_PUBLIC_SHOW_BETA_BANNER === "true",

  // Observability
  observability: {
    sentry: {
      dsn: env.SENTRY_DSN,
      environment: env.SENTRY_ENV || env.NODE_ENV,
      enabled: Boolean(env.SENTRY_DSN),
    },
  },
} as const;

/**
 * Validate configuration on startup
 */
export function validateConfig() {
  const errors: string[] = [];

  // Required for all environments
  if (!config.database.url) {
    errors.push("DATABASE_URL is required");
  }

  if (!config.auth.secret || config.auth.secret.length < 32) {
    errors.push("NEXTAUTH_SECRET must be at least 32 characters");
  }

  if (!config.security.qrSecret || config.security.qrSecret.length < 32) {
    errors.push("QR_SECRET must be at least 32 characters");
  }

  // Required for staging/production
  if (isStaging || isProduction) {
    if (!config.email.enabled) {
      errors.push("Email configuration is required for staging/production");
    }

    if (!config.storage.enabled) {
      errors.push("Storage configuration is required for staging/production");
    }

    if (!config.payments.stripe.enabled && !config.payments.mock.enabled) {
      errors.push("Payment configuration is required for staging/production");
    }
  }

  if (errors.length > 0) {
    console.error("❌ Configuration validation failed:");
    errors.forEach((error) => console.error(`   - ${error}`));
    console.error("\n💡 Please check your environment variables.\n");
    throw new Error("Configuration validation failed");
  }

  // Log configuration status
  console.log("✅ Configuration validated");
  console.log(`   Environment: ${config.env.name}`);
  console.log(`   Email: ${config.email.enabled ? "✅ Enabled" : "⚠️  Disabled"}`);
  console.log(`   Storage: ${config.storage.enabled ? "✅ Enabled" : "⚠️  Disabled"}`);
  console.log(`   Payments: ${config.payments.stripe.enabled ? "✅ Stripe" : config.payments.mock.enabled ? "✅ Mock" : "⚠️  Disabled"}`);
}

