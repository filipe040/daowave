// Script para habilitar RLS na tabela _prisma_migrations
// Esta tabela é gerida pelo Prisma, mas podemos adicionar RLS para segurança

const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

// Load .env from root
const rootEnv = path.join(__dirname, '../../.env');
if (fs.existsSync(rootEnv)) {
  const envContent = fs.readFileSync(rootEnv, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const prisma = new PrismaClient();

async function enableRLSForPrismaMigrations() {
  try {
    console.log('🔒 Habilitando RLS na tabela _prisma_migrations...\n');
    
    await prisma.$connect();
    
    // Enable RLS on _prisma_migrations
    await prisma.$executeRawUnsafe(`ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY`);
    
    // Drop existing policy if exists
    try {
      await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "Deny all public access" ON "_prisma_migrations"`);
    } catch (e) {
      // Policy might not exist, ignore
    }
    
    // Create deny all policy
    await prisma.$executeRawUnsafe(`CREATE POLICY "Deny all public access" ON "_prisma_migrations" FOR ALL USING (false)`);
    
    console.log('✅ RLS habilitado na tabela _prisma_migrations!');
    console.log('💡 Nota: Prisma continua a funcionar normalmente (usa service role)');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    
    if (error.message.includes('does not exist')) {
      console.log('\n⚠️  Tabela _prisma_migrations não existe ainda (normal em novos projetos)');
    } else if (error.message.includes('already enabled')) {
      console.log('\n✅ RLS já estava habilitado');
    } else {
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

enableRLSForPrismaMigrations();
