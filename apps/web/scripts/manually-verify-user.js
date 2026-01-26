/**
 * Script to manually verify a user's email
 * Usage: node scripts/manually-verify-user.js <email>
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyUser(email) {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      console.log(`❌ User not found: ${email}`);
      process.exit(1);
    }

    if (user.emailVerified) {
      console.log(`✅ User already verified: ${email}`);
      console.log(`   User ID: ${user.id}`);
      process.exit(0);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpiresAt: null,
      },
    });

    console.log(`✅ User verified successfully: ${email}`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Name: ${user.name || 'N/A'}`);
  } catch (error) {
    console.error('❌ Error verifying user:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2];

if (!email) {
  console.log('Usage: node scripts/manually-verify-user.js <email>');
  process.exit(1);
}

verifyUser(email);
