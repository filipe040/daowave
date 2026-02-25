import Redis from "ioredis";

// Global connection to reuse in development
const globalForRedis = global as unknown as { redis: Redis };

export const redis = globalForRedis.redis || new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
});

if (process.env.NODE_ENV !== "production") {
    globalForRedis.redis = redis;
}
