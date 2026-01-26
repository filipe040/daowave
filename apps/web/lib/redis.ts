// lib/redis.ts
// COMPLETELY DISABLED - No Redis connection for Vercel build
// CRITICAL: This file NEVER imports ioredis or creates Redis instances
// Even if imported, it will NEVER attempt to connect

// Check if we're in build phase - CRITICAL for preventing connections
const isBuildPhase = (): boolean => {
  if (typeof window !== 'undefined') return false; // Client-side
  
  return (
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.NEXT_PHASE === 'phase-development-build' ||
    process.env.NEXT_PHASE === 'phase-export' ||
    process.env.NEXT_PHASE === 'phase-production-build' ||
    (process.env.NODE_ENV === 'production' && !process.env.VERCEL && !process.env.REDIS_URL) ||
    process.env.VERCEL_ENV === undefined ||
    process.env.NODE_ENV === 'test'
  );
};

// Type definitions only - NO runtime imports
export type Redis = any;

// Configuration object (no actual connection, just for reference)
export const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
};

// Singleton - always null, NEVER instantiated
let _redis: any = null;

// Get Redis connection - ALWAYS RETURNS NULL
// CRITICAL: This function NEVER imports ioredis or creates Redis instances
export function getRedisConnection(): any | null {
  // Always return null - Redis completely disabled
  return null;
}

// Alias for compatibility
export function getRedis(): any | null {
  return null;
}

// Check connection - ALWAYS RETURNS FALSE
export async function checkRedisConnection(): Promise<boolean> {
  return false;
}

// Close connection - NO-OP
export async function closeRedisConnection(): Promise<void> {
  return;
}

// Get Redis connection config - ALWAYS RETURNS NULL
export function getRedisConnectionConfig(): any | null {
  return null;
}

// Export a getter that returns null - NEVER creates Redis instance
// This prevents any top-level instantiation
export const redis = (() => {
  if (isBuildPhase()) {
    return null;
  }
  return null; // Always null - Redis disabled
})();

// Default export for compatibility
export default {
  getRedisConnection,
  getRedis,
  checkRedisConnection,
  closeRedisConnection,
  getRedisConnectionConfig,
  redis: null, // Explicitly null
};
