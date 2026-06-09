/**
 * Rate limiting — Redis (multi-instância) com fallback in-memory.
 */

import { getRedisClient } from "./redis-client";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

const store: RateLimitStore = {};

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 60,
};

function memoryCheck(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  let entry = store[identifier];

  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + config.windowMs };
    store[identifier] = entry;
  }

  entry.count++;
  const allowed = entry.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - entry.count);

  if (Object.keys(store).length > 10000) {
    Object.keys(store).forEach((k) => {
      if (store[k].resetAt < now) delete store[k];
    });
  }

  return { allowed, remaining, resetAt: entry.resetAt };
}

async function redisCheck(
  identifier: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: number } | null> {
  const redis = await getRedisClient();
  if (!redis) return null;

  const windowKey = Math.floor(Date.now() / config.windowMs);
  const key = `rl:${identifier}:${windowKey}`;

  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.pexpire(key, config.windowMs);
    }
    const allowed = count <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - count);
    const resetAt = (windowKey + 1) * config.windowMs;
    return { allowed, remaining, resetAt };
  } catch {
    return null;
  }
}

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = defaultConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const fromRedis = await redisCheck(identifier, config);
  if (fromRedis) return fromRedis;
  return memoryCheck(identifier, config);
}

/** @deprecated Use async checkRateLimit */
export function checkRateLimitSync(
  identifier: string,
  config: RateLimitConfig = defaultConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  return memoryCheck(identifier, config);
}

export function getClientIdentifier(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  return forwarded?.split(",")[0]?.trim() || realIp || "unknown";
}

export function rateLimit(config?: RateLimitConfig) {
  return async (req: Request): Promise<Response | null> => {
    const identifier = getClientIdentifier(req);
    const result = await checkRateLimit(identifier, config);

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
      return new Response(
        JSON.stringify({
          error: "Too many requests",
          message: "Rate limit exceeded. Please try again later.",
          retryAfter,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(config?.maxRequests ?? defaultConfig.maxRequests),
            "X-RateLimit-Remaining": String(result.remaining),
            "X-RateLimit-Reset": String(result.resetAt),
          },
        }
      );
    }

    return null;
  };
}
