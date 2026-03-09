import Redis from "ioredis";

// Global connection to reuse in development
const globalForRedis = global as unknown as { redis: Redis };

export const redis = globalForRedis.redis || new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
    lazyConnect: true,
});

redis.on('error', (err) => {
    if (process.env.NODE_ENV !== "production" || process.env.NEXT_PHASE !== undefined) {
        console.warn('Redis connection error (ignoring during build):', err.message);
    }
});

if (process.env.NODE_ENV !== "production") {
    globalForRedis.redis = redis;
}
