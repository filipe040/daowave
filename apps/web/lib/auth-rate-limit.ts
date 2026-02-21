/**
 * In-memory sliding window rate limiter for auth endpoints.
 * Uses a Map keyed by IP; no Redis required.
 *
 * Usage:
 *   const limiter = new AuthRateLimiter();
 *   const ok = limiter.check(ip, 10, 60_000); // 10 req per 60s
 *   if (!ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
 */

type WindowEntry = { timestamps: number[] };

export class AuthRateLimiter {
    private readonly store = new Map<string, WindowEntry>();
    private readonly cleanupInterval: NodeJS.Timeout;

    constructor() {
        // Purge old entries every 2 min to avoid memory leak
        this.cleanupInterval = setInterval(() => this.cleanup(), 2 * 60 * 1000);
        if (typeof this.cleanupInterval.unref === "function") {
            this.cleanupInterval.unref();
        }
    }

    /**
     * @param key       Unique key (e.g. IP address)
     * @param maxHits   Max allowed requests in windowMs
     * @param windowMs  Window duration in milliseconds
     * @returns true if request is allowed, false if rate-limited
     */
    check(key: string, maxHits: number, windowMs: number): boolean {
        const now = Date.now();
        const entry = this.store.get(key) ?? { timestamps: [] };

        // Remove timestamps outside the window
        entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

        if (entry.timestamps.length >= maxHits) {
            this.store.set(key, entry);
            return false;
        }

        entry.timestamps.push(now);
        this.store.set(key, entry);
        return true;
    }

    private cleanup() {
        const stale = Date.now() - 5 * 60 * 1000; // entries older than 5 min
        for (const [key, entry] of this.store) {
            if (entry.timestamps.every((t) => t < stale)) {
                this.store.delete(key);
            }
        }
    }
}

// Singleton — shared across all auth API route invocations in the same process
export const authLimiter = new AuthRateLimiter();
