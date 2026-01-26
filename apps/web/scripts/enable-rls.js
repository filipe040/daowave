// Script para habilitar Row Level Security (RLS) em todas as tabelas do Supabase
// Este script resolve os avisos de segurança do Supabase Database Linter

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

const RLS_POLICIES = `
-- Enable Row Level Security (RLS) on all tables
DO $$ 
DECLARE
    table_name text;
BEGIN
    -- Lista de tabelas (excluindo _prisma_migrations)
    FOR table_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename != '_prisma_migrations'
    LOOP
        -- Enable RLS
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
        
        -- Drop existing policy if exists
        EXECUTE format('DROP POLICY IF EXISTS "Deny all public access" ON %I', table_name);
        
        -- Create deny all policy
        EXECUTE format('CREATE POLICY "Deny all public access" ON %I FOR ALL USING (false)', table_name);
        
        RAISE NOTICE 'RLS enabled and policy created for table: %', table_name;
    END LOOP;
END $$;
`;

async function enableRLS() {
  try {
    console.log('🔒 Habilitando Row Level Security (RLS) em todas as tabelas...\n');
    
    await prisma.$connect();
    
    // Execute the SQL to enable RLS
    await prisma.$executeRawUnsafe(RLS_POLICIES);
    
    console.log('✅ RLS habilitado com sucesso em todas as tabelas!');
    console.log('\n📋 Políticas criadas:');
    console.log('   - Todas as tabelas têm RLS habilitado');
    console.log('   - Política "Deny all public access" criada para bloquear acesso público via PostgREST');
    console.log('   - Prisma Client continua a funcionar normalmente (usa service role)');
    console.log('\n💡 Nota: A tabela _prisma_migrations foi excluída (gerida pelo Prisma)');
    
  } catch (error) {
    console.error('❌ Erro ao habilitar RLS:', error.message);
    
    if (error.message.includes('already enabled')) {
      console.log('\n⚠️  RLS já estava habilitado. Continuando...');
    } else {
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

enableRLS();
