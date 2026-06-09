/**
 * Cliente Redis opcional — só liga em runtime quando REDIS_URL está definido.
 * Nunca importa ioredis durante build/SSG.
 */

type RedisClient = import("ioredis").default;

let client: RedisClient | null = null;
let connectPromise: Promise<RedisClient | null> | null = null;

function isBuildPhase(): boolean {
  return (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.NEXT_PHASE === "phase-development-build" ||
    process.env.NEXT_PHASE === "phase-export" ||
    process.env.NODE_ENV === "test"
  );
}

export async function getRedisClient(): Promise<RedisClient | null> {
  if (isBuildPhase() || !process.env.REDIS_URL) return null;

  if (client) return client;
  if (connectPromise) return connectPromise;

  connectPromise = (async () => {
    try {
      const Redis = (await import("ioredis")).default;
      const instance = new Redis(process.env.REDIS_URL!, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true,
        connectTimeout: 5000,
      });
      await instance.connect();
      client = instance;
      return instance;
    } catch {
      client = null;
      return null;
    } finally {
      connectPromise = null;
    }
  })();

  return connectPromise;
}

export async function checkRedisConnection(): Promise<boolean> {
  const redis = await getRedisClient();
  if (!redis) return false;
  try {
    const pong = await redis.ping();
    return pong === "PONG";
  } catch {
    return false;
  }
}

export async function closeRedisClient(): Promise<void> {
  if (client) {
    await client.quit().catch(() => undefined);
    client = null;
  }
}
