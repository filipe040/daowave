const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Starting Site Fix & Setup...');

try {
    // 1. Check Environment
    const envPath = path.join(__dirname, '../.env');
    if (!fs.existsSync(envPath)) {
        console.warn('⚠️  .env file not found! setup might fail if env vars are missing.');
    }

    // 2. Generate Prisma Client
    console.log('🔄 Generating Prisma Client...');
    execSync('npx prisma generate', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

    // 3. Migrate Database
    console.log('📦 Applying Database Migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

    // 4. Seed Database (Optional but recommended for fix)
    console.log('🌱 Seeding Database (if needed)...');
    try {
        execSync('npx prisma db seed', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    } catch (seedError) {
        console.warn('⚠️  Seeding failed (might be duplicate unique keys), continuing...');
    }

    console.log('✅ Site Fix Completed Successfully!');

} catch (error) {
    console.error('❌ Error during fix-site:', error.message);
    process.exit(1);
}
