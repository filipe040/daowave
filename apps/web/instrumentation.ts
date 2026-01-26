/**
 * Next.js instrumentation hook
 * Runs once when the server starts
 * 
 * CRITICAL: This hook does NOT initialize Redis/Queue to prevent connection attempts during build
 * - Only initializes Sentry (lightweight)
 * - init() is called on-demand in API routes that need it (not here)
 * - This prevents any Redis connection attempts during build/SSG
 */

/**
 * Check if we're in build phase (Edge-safe, no process.argv)
 */
function isBuildPhase(): boolean {
  // CRITICAL: Use ONLY NEXT_PHASE env var - no process.argv (not available in Edge Runtime)
  return process.env.NEXT_PHASE === "phase-production-build" || 
         process.env.NEXT_PHASE === "phase-development-build" ||
         process.env.NEXT_PHASE === "phase-export";
}

export async function register() {
  // CRITICAL: Skip ALL initialization during build phase
  // Return immediately without any imports
  if (isBuildPhase()) {
    // During build, skip ALL initialization to avoid Redis connection attempts
    // CRITICAL: Do NOT import init.ts or queue.ts during build
    return;
  }

  // Only run in Node.js runtime (not Edge) and NOT during build
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      // Initialize Sentry on server (only at runtime, lightweight)
      // CRITICAL: Check SENTRY_DSN before importing to prevent webpack warnings
      if (process.env.SENTRY_DSN) {
        const { initSentry } = await import("./lib/sentry");
        await initSentry(); // Now async
      }
      
      // CRITICAL: Do NOT call init() here - it would trigger Redis connection
      // init() should be called on-demand in API routes that need it
      // This prevents Redis connection attempts during build/SSG
    } catch (error) {
      // Log error but don't crash - instrumentation should be resilient
      console.error("⚠️  Instrumentation initialization failed:", error instanceof Error ? error.message : "unknown");
    }
  }
}
