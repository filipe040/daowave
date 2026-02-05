import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {},
    errors: []
  };

  try {
    // 1. Test database connection
    debugInfo.checks.databaseConnection = 'testing';
    try {
      await prisma.$connect();
      const userCount = await prisma.user.count();
      debugInfo.checks.databaseConnection = `✅ Connected (${userCount} users)`;
    } catch (error: any) {
      debugInfo.checks.databaseConnection = `❌ Failed: ${error.message}`;
      debugInfo.errors.push(`Database: ${error.message}`);
    }

    // 2. Test NextAuth configuration
    debugInfo.checks.nextAuthConfig = 'testing';
    try {
      const session = await getServerSession(authOptions);
      debugInfo.checks.nextAuthConfig = session ? '✅ Session exists' : '⚠️ No session';

      if (session) {
        debugInfo.sessionInfo = {
          userId: session.user?.id,
          email: session.user?.email,
          role: (session.user as any)?.role,
          hasName: !!session.user?.name
        };
      }
    } catch (error: any) {
      debugInfo.checks.nextAuthConfig = `❌ Failed: ${error.message}`;
      debugInfo.errors.push(`NextAuth: ${error.message}`);
    }

    // 3. Test environment variables
    debugInfo.checks.environmentVariables = {};
    const requiredEnvs = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL',
      'QR_SECRET'
    ];

    requiredEnvs.forEach(env => {
      if (process.env[env]) {
        debugInfo.checks.environmentVariables[env] = '✅ Present';
      } else {
        debugInfo.checks.environmentVariables[env] = '❌ Missing';
        debugInfo.errors.push(`Missing env var: ${env}`);
      }
    });

    // 4. Test User table structure
    debugInfo.checks.userTableStructure = 'testing';
    try {
      const sampleUser = await prisma.user.findFirst({
        select: {
          id: true,
          email: true,
          role: true,
          emailVerified: true,
          // Test if new columns exist
          avatarUrl: true,
          phone: true,
          emailVerifiedAt: true,
          lastLoginAt: true,
          termsAcceptedAt: true,
          termsVersion: true,
          marketingOptIn: true,
          notifyEmail: true,
          notifyEventReminders: true,
          notifyTransfers: true,
        }
      });

      if (sampleUser) {
        debugInfo.checks.userTableStructure = '✅ All columns present';
        debugInfo.sampleUserFields = Object.keys(sampleUser);
      } else {
        debugInfo.checks.userTableStructure = '⚠️ No users found';
      }
    } catch (error: any) {
      debugInfo.checks.userTableStructure = `❌ Failed: ${error.message}`;
      debugInfo.errors.push(`User table: ${error.message}`);

      if (error.message.includes('Unknown column') || error.message.includes("doesn't exist")) {
        debugInfo.migrationNeeded = true;
        debugInfo.solution = 'Run: npx prisma migrate deploy';
      }
    }

    // 5. Test UserSession table
    debugInfo.checks.userSessionTable = 'testing';
    try {
      const sessionCount = await prisma.userSession.count();
      debugInfo.checks.userSessionTable = `✅ Present (${sessionCount} sessions)`;
    } catch (error: any) {
      debugInfo.checks.userSessionTable = `❌ Failed: ${error.message}`;
      debugInfo.errors.push(`UserSession table: ${error.message}`);
    }

    // 6. Test AuditLog table
    debugInfo.checks.auditLogTable = 'testing';
    try {
      const auditCount = await prisma.auditLog.count();
      debugInfo.checks.auditLogTable = `✅ Present (${auditCount} logs)`;
    } catch (error: any) {
      debugInfo.checks.auditLogTable = `❌ Failed: ${error.message}`;
      debugInfo.errors.push(`AuditLog table: ${error.message}`);
    }

  } catch (error: any) {
    debugInfo.criticalError = error.message;
    debugInfo.errors.push(`Critical: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }

  // Generate summary
  const totalChecks = Object.keys(debugInfo.checks).length;
  const passedChecks = Object.values(debugInfo.checks).filter(check =>
    typeof check === 'string' && check.includes('✅')
  ).length;

  debugInfo.summary = {
    totalChecks,
    passedChecks,
    failedChecks: totalChecks - passedChecks,
    hasErrors: debugInfo.errors.length > 0,
    status: debugInfo.errors.length === 0 ? 'HEALTHY' : 'ISSUES_FOUND'
  };

  // Add recommendations
  debugInfo.recommendations = [];
  if (debugInfo.migrationNeeded) {
    debugInfo.recommendations.push('Run database migrations: npx prisma migrate deploy');
  }
  if (debugInfo.errors.some((e: string) => e.includes('Database'))) {
    debugInfo.recommendations.push('Check database connection and credentials');
  }
  if (debugInfo.errors.some((e: string) => e.includes('env var'))) {
    debugInfo.recommendations.push('Add missing environment variables');
  }

  return NextResponse.json(debugInfo, {
    status: debugInfo.errors.length > 0 ? 500 : 200,
    headers: {
      'Content-Type': 'application/json',
    }
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    error: 'Method not allowed',
    message: 'Use GET to run auth diagnostics'
  }, {
    status: 405
  });
}
