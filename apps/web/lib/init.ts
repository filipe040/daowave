// lib/init.ts
// DISABLED - No initialization for Vercel build
// CRITICAL: This file NEVER initializes Redis or Queue workers

// Check if we're in build phase
const isBuildPhase = (): boolean => {
  if (typeof window !== 'undefined') return false; // Client-side
  
  return (
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.NEXT_PHASE === 'phase-development-build' ||
    process.env.NEXT_PHASE === 'phase-export' ||
    (process.env.NODE_ENV === 'production' && !process.env.VERCEL && !process.env.REDIS_URL) ||
    process.env.VERCEL_ENV === undefined
  );
};

// Initialize queues - NO-OP (always disabled)
export function initializeQueues(): void {
  if (isBuildPhase()) return;
  return; // Always disabled
}

// Re-export everything from queue.ts (but functions return null)
export * from './queue';
