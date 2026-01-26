/**
 * Environment variables validation for critical startup variables
 * Fails fast if required variables are missing
 * 
 * This is called at application startup to ensure all critical
 * environment variables are present before the app starts.
 */

import { z } from "zod";

/**
 * Critical environment variables schema
 * These MUST be present for the app to start
 */
const criticalEnvSchema = z.object({
  // Database (required)
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .url("DATABASE_URL must be a valid PostgreSQL URL")
    .refine(
      (url) => url.startsWith("postgresql://") || url.startsWith("postgres://"),
      "DATABASE_URL must be a PostgreSQL connection string"
    ),

  // DIRECT_URL is optional but recommended for Supabase
  DIRECT_URL: z
    .string()
    .url("DIRECT_URL must be a valid PostgreSQL URL")
    .optional()
    .refine(
      (url) => !url || url.startsWith("postgresql://") || url.startsWith("postgres://"),
      "DIRECT_URL must be a PostgreSQL connection string"
    ),

  // Authentication (required)
  NEXTAUTH_SECRET: z
    .string()
    .min(32, "NEXTAUTH_SECRET must be at least 32 characters")
    .refine(
      (secret) => secret !== "your-secret-key-change-in-production",
      "NEXTAUTH_SECRET must be changed from default value"
    ),

  NEXTAUTH_URL: z
    .string()
    .min(1, "NEXTAUTH_URL is required")
    .url("NEXTAUTH_URL must be a valid URL"),

  // QR Security (required)
  QR_SECRET: z
    .string()
    .min(32, "QR_SECRET must be at least 32 characters")
    .refine(
      (secret) => secret !== "your-qr-secret-change-in-production",
      "QR_SECRET must be changed from default value"
    ),
});

/**
 * Validate critical environment variables
 * Throws error and exits if validation fails
 */
export function validateCriticalEnv(): void {
  try {
    criticalEnvSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("\n❌ CRITICAL: Environment variable validation failed!\n");
      console.error("Missing or invalid required environment variables:\n");
      
      error.errors.forEach((err) => {
        const path = err.path.join(".");
        console.error(`   ❌ ${path}: ${err.message}`);
      });

      console.error("\n💡 Required environment variables:");
      console.error("   - DATABASE_URL (PostgreSQL connection string)");
      console.error("   - DIRECT_URL (Optional, but recommended for Supabase migrations)");
      console.error("   - NEXTAUTH_SECRET (Minimum 32 characters)");
      console.error("   - NEXTAUTH_URL (Base URL of the application)");
      console.error("   - QR_SECRET (Minimum 32 characters)");
      
      console.error("\n💡 Please check your .env file and ensure all required variables are set.");
      console.error("💡 See .env.example for reference.\n");
      
      // CRITICAL: Don't use process.exit - throw error instead (safer for serverless)
      // process.exit is not available in Edge Runtime and can cause issues during build
      // throw error; // Already throwing below
    }
    throw error;
  }
}

/**
 * Validate environment variables and log status
 */
export function validateAndLogEnv(): void {
  validateCriticalEnv();
  
  console.log("✅ Environment variables validated");
  console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? "✅ Set" : "❌ Missing"}`);
  console.log(`   DIRECT_URL: ${process.env.DIRECT_URL ? "✅ Set" : "⚠️  Not set (optional for Supabase)"}`);
  console.log(`   NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? "✅ Set" : "❌ Missing"}`);
  console.log(`   NEXTAUTH_URL: ${process.env.NEXTAUTH_URL ? "✅ Set" : "❌ Missing"}`);
  console.log(`   QR_SECRET: ${process.env.QR_SECRET ? "✅ Set" : "❌ Missing"}`);
}

