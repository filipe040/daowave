/**
 * Script de setup específico para Supabase
 * Usage: DATABASE_URL=... node scripts/setup-supabase.js
 */

const { PrismaClient } = require("@prisma/client");
const { execSync } = require("child_process");

const prisma = new PrismaClient();

async function setupSupabase() {
  console.log("🚀 Configurando Supabase para 7even Tickets\n");

  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error("❌ DATABASE_URL não está definido");
    console.error("\n💡 Configure DATABASE_URL:");
    console.error("   export DATABASE_URL='postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true'");
    console.error("\n   Ou adicione ao arquivo .env:");
    console.error("   DATABASE_URL=postgresql://...");
    process.exit(1);
  }

  // Check if it's a Supabase URL
  if (!dbUrl.includes("supabase.com")) {
    console.warn("⚠️  DATABASE_URL não parece ser do Supabase");
    console.warn("   Continuando mesmo assim...\n");
  }

  try {
    // Step 1: Test connection
    console.log("1️⃣  Testando conexão com Supabase...");
    await prisma.$connect();
    console.log("   ✅ Conexão estabelecida\n");

    // Step 2: Check PostgreSQL version
    console.log("2️⃣  Verificando versão do PostgreSQL...");
    const version = await prisma.$queryRaw`SELECT version()`;
    const pgVersion = version[0].version.match(/PostgreSQL (\d+\.\d+)/)?.[1];
    console.log(`   ✅ PostgreSQL ${pgVersion}\n`);

    // Step 3: Check if using connection pooler
    if (dbUrl.includes("pooler.supabase.com") || dbUrl.includes("6543")) {
      console.log("3️⃣  Connection Pooler detectado ✅");
      console.log("   Usando porta 6543 (Connection Pooler)");
      console.log("   Recomendado para produção\n");
    } else if (dbUrl.includes("5432")) {
      console.log("3️⃣  Session Mode detectado");
      console.log("   Usando porta 5432 (Session Mode)");
      console.log("   Recomendado para migrations\n");
    }

    // Step 4: Check existing tables
    console.log("4️⃣  Verificando tabelas existentes...");
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    if (tables.length === 0) {
      console.log("   ⚠️  Nenhuma tabela encontrada");
      console.log("   Será necessário aplicar migrations\n");
    } else {
      console.log(`   ✅ ${tables.length} tabela(s) encontrada(s)\n`);
    }

    // Step 5: Check migrations
    console.log("5️⃣  Verificando migrations...");
    try {
      const migrations = await prisma.$queryRaw`
        SELECT migration_name, finished_at 
        FROM _prisma_migrations 
        ORDER BY finished_at DESC 
        LIMIT 5
      `;

      if (migrations.length === 0) {
        console.log("   ⚠️  Nenhuma migration encontrada");
        console.log("   Execute: npm run db:migrate:deploy\n");
      } else {
        console.log(`   ✅ ${migrations.length} migration(s) aplicada(s)\n`);
      }
    } catch (error) {
      console.log("   ⚠️  Tabela de migrations não existe");
      console.log("   Execute: npm run db:migrate:deploy\n");
    }

    // Step 6: Recommendations
    console.log("6️⃣  Recomendações para Supabase:\n");
    
    if (!dbUrl.includes("pgbouncer=true")) {
      console.log("   ⚠️  Adicionar ?pgbouncer=true ao DATABASE_URL");
      console.log("      Melhora performance e reduz conexões\n");
    }

    if (!dbUrl.includes("connection_limit")) {
      console.log("   💡 Adicionar &connection_limit=1 ao DATABASE_URL");
      console.log("      Limita conexões por instância\n");
    }

    if (dbUrl.includes("5432") && !dbUrl.includes("pooler")) {
      console.log("   💡 Para produção, usar Connection Pooler (porta 6543)");
      console.log("      Formato: ...pooler.supabase.com:6543/postgres\n");
    }

    console.log("✅ Setup concluído!\n");
    console.log("📋 Próximos passos:");
    console.log("   1. Aplicar migrations: npm run db:migrate:deploy");
    console.log("   2. Seed database: npm run db:seed:staging");
    console.log("   3. Verificar: npm run db:check");
    console.log("   4. Abrir Prisma Studio: npx prisma studio");

  } catch (error) {
    console.error("\n❌ Erro durante setup:");
    console.error(`   ${error.message}\n`);

    if (error.message.includes("P1001")) {
      console.error("💡 Possíveis causas:");
      console.error("   - DATABASE_URL incorreto");
      console.error("   - IP não está na whitelist do Supabase");
      console.error("   - Servidor Supabase não acessível");
      console.error("\n   Verificar:");
      console.error("   - Settings → Database → Connection Pooling → Allowed IPs");
      console.error("   - Adicionar seu IP público se necessário");
    } else if (error.message.includes("SSL")) {
      console.error("💡 Adicionar ?sslmode=require ao DATABASE_URL");
    } else if (error.message.includes("password")) {
      console.error("💡 Verificar password no Supabase Dashboard");
      console.error("   Settings → Database → Database Password");
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupSupabase();

