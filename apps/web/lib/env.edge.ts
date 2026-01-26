/**
 * Edge-safe environment variables
 * 
 * CRITICAL: This module is Edge Runtime compatible
 * - NO process.argv
 * - NO process.exit
 * - NO fs/path/__dirname
 * - NO validation that throws
 * - Only reads process.env directly
 * 
 * Use this in middleware, Edge functions, and any Edge-compatible code
 * 
 * For server-side code (API routes, server components), use lib/env.server.ts instead
 */

/**
 * Read environment variable (Edge-safe)
 * Returns undefined if not set, never throws
 */
export function getEnv(key: string): string | undefined {
  return process.env[key];
}

/**
 * Read environment variable with default (Edge-safe)
 */
export function getEnvWithDefault(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

/**
 * Check if environment variable is set (Edge-safe)
 */
export function hasEnv(key: string): boolean {
  return Boolean(process.env[key]);
}

/**
 * Edge-safe environment helpers
 * These are safe to use in Edge Runtime
 * All values are read directly from process.env without validation
 */
export const edgeEnv = {
  // Environment
  NODE_ENV: process.env.NODE_ENV || "development",
  
  // Authentication
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL,
  
  // Redis
  REDIS_URL: process.env.REDIS_URL,
  
  // Application
  APP_URL: process.env.APP_URL,
  VERCEL_URL: process.env.VERCEL_URL,
  
  // CORS
  CORS_ORIGINS: process.env.CORS_ORIGINS,
  
  // Feature Flags (as strings, convert to boolean if needed)
  SHOW_BETA_BANNER: process.env.SHOW_BETA_BANNER,
  BETA_CLOSED_REGISTRATION: process.env.BETA_CLOSED_REGISTRATION,
} as const;

/**
 * Edge-safe environment helpers (computed values)
 */
export const edgeEnvHelpers = {
  isDevelopment: edgeEnv.NODE_ENV === "development",
  isStaging: (edgeEnv.NODE_ENV as string) === "staging",
  isProduction: edgeEnv.NODE_ENV === "production",
  isVercel: Boolean(process.env.VERCEL),
} as const;
