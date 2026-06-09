/**
 * Prisma Client Singleton
 * Prevents multiple instances in development
 * CRITICAL: Does not connect during build phase
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Check if we're in build phase
const isBuildPhase = (): boolean => {
  return (
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.NEXT_PHASE === 'phase-development-build' ||
    process.env.NEXT_PHASE === 'phase-export' ||
    process.env.VERCEL === '1' && !process.env.DATABASE_URL
  );
};

// Create Prisma Client - will not connect until first query
// Produção: use DATABASE_URL com pool, ex.:
// mysql://user:pass@host:3306/db?connection_limit=20&pool_timeout=20
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' && !isBuildPhase() 
      ? ['query', 'error', 'warn'] 
      : ['error'],
    datasources: {
      db: {
        url: isBuildPhase() && !process.env.DATABASE_URL
          ? 'mysql://dummy:dummy@localhost:3306/dummy'
          : process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
