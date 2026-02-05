#!/usr/bin/env node

/**
 * Database Diagnostic Script
 * Run this in production to diagnose database issues
 *
 * Usage:
 * node scripts/diagnose-db.js
 *
 * Or in production:
 * npm run diagnose:db
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  console.log('🔍 Starting Database Diagnostics...\n');

  try {
    // Test 1: Basic connection
    console.log('1️⃣ Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    // Test 2: Check if tables exist
    console.log('2️⃣ Checking database schema...');

    try {
      const userCount = await prisma.user.count();
      console.log(`✅ User table exists (${userCount} users)`);
    } catch (error) {
      console.log(`❌ User table issue: ${error.message}`);
    }

    try {
      const eventCount = await prisma.event.count();
      console.log(`✅ Event table exists (${eventCount} events)`);
    } catch (error) {
      console.log(`❌ Event table issue: ${error.message}`);
    }

    try {
      const orderCount = await prisma.order.count();
      console.log(`✅ Order table exists (${orderCount} orders)`);
    } catch (error) {
      console.log(`❌ Order table issue: ${error.message}`);
    }

    try {
      const auditCount = await prisma.auditLog.count();
      console.log(`✅ AuditLog table exists (${auditCount} logs)`);
    } catch (error) {
      console.log(`❌ AuditLog table issue: ${error.message}`);
    }

    // Test 3: Check User table structure
    console.log('\n3️⃣ Checking User table structure...');
    try {
      const sampleUser = await prisma.user.findFirst({
        select: {
          id: true,
          email: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          emailVerificationToken: true,
          passwordResetToken: true,
          // Test new columns
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
        console.log('✅ User table structure looks correct');
        console.log('Sample user fields:', Object.keys(sampleUser));
      } else {
        console.log('⚠️  No users found in database');
      }
    } catch (error) {
      console.log(`❌ User table structure issue: ${error.message}`);
      console.log('This usually means missing migrations!');
    }

    // Test 4: Check UserSession table (needed for auth)
    console.log('\n4️⃣ Checking UserSession table...');
    try {
      const sessionCount = await prisma.userSession.count();
      console.log(`✅ UserSession table exists (${sessionCount} sessions)`);
    } catch (error) {
      console.log(`❌ UserSession table issue: ${error.message}`);
      console.log('This table is required for session management!');
    }

    // Test 5: Environment variables
    console.log('\n5️⃣ Checking environment variables...');

    const requiredEnvs = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL',
      'QR_SECRET'
    ];

    requiredEnvs.forEach(env => {
      if (process.env[env]) {
        const value = env.includes('SECRET') || env.includes('URL')
          ? '***HIDDEN***'
          : process.env[env];
        console.log(`✅ ${env}: ${value}`);
      } else {
        console.log(`❌ ${env}: MISSING`);
      }
    });

    // Test 6: Try to create/read a test record
    console.log('\n6️⃣ Testing database operations...');

    try {
      // Try to find any user to test read operations
      const testUser = await prisma.user.findFirst();
      if (testUser) {
        console.log(`✅ Can read users (found user: ${testUser.email})`);
      } else {
        console.log('⚠️  No users in database');
      }
    } catch (error) {
      console.log(`❌ Cannot read users: ${error.message}`);
    }

  } catch (error) {
    console.error('💥 Critical database error:', error);
    console.error('\nThis usually means:');
    console.error('1. Database is not running');
    console.error('2. Wrong DATABASE_URL');
    console.error('3. Missing database migrations');
    console.error('4. Network/firewall issues');
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n📋 Diagnostic complete!');
  console.log('\n💡 Next steps if there are issues:');
  console.log('1. Run: npx prisma migrate deploy');
  console.log('2. Run: npx prisma generate');
  console.log('3. Restart the application');
  console.log('4. Check logs: pm2 logs (if using PM2)');
}

// Handle process termination gracefully
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Diagnostic interrupted');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\n🛑 Diagnostic terminated');
  await prisma.$disconnect();
  process.exit(0);
});

main().catch((error) => {
  console.error('💥 Diagnostic script failed:', error);
  process.exit(1);
});
