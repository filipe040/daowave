/**
 * Script para verificar conexão com base de dados externa
 * Usage: node scripts/check-external-db.js
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkDatabase() {
  console.log("🔍 Verificando conexão com base de dados...\n");

  try {
    // Test connection
    console.log("1. Testando conexão...");
    await prisma.$connect();
    console.log("   ✅ Conexão estabelecida\n");

    // Check database version
    console.log("2. Verificando versão do PostgreSQL...");
    const version = await prisma.$queryRaw`SELECT version()`;
    console.log(`   ✅ ${version[0].version}\n`);

    // Check current database
    console.log("3. Verificando database atual...");
    const dbName = await prisma.$queryRaw`SELECT current_database()`;
    console.log(`   ✅ Database: ${dbName[0].current_database}\n`);

    // Check tables
    console.log("4. Verificando tabelas existentes...");
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    if (tables.length === 0) {
      console.log("   ⚠️  Nenhuma tabela encontrada. Execute migrations primeiro.\n");
    } else {
      console.log(`   ✅ ${tables.length} tabela(s) encontrada(s):`);
      tables.forEach((table) => {
        console.log(`      - ${table.table_name}`);
      });
      console.log();
    }

    // Check migrations
    console.log("5. Verificando migrations aplicadas...");
    try {
      const migrations = await prisma.$queryRaw`
        SELECT migration_name, finished_at 
        FROM _prisma_migrations 
        ORDER BY finished_at DESC 
        LIMIT 5
      `;
      
      if (migrations.length === 0) {
        console.log("   ⚠️  Nenhuma migration encontrada. Execute 'npm run db:migrate:deploy'\n");
      } else {
        console.log(`   ✅ ${migrations.length} migration(s) recente(s):`);
        migrations.forEach((migration) => {
          console.log(`      - ${migration.migration_name} (${migration.finished_at})`);
        });
        console.log();
      }
    } catch (error) {
      console.log("   ⚠️  Tabela de migrations não encontrada. Execute migrations primeiro.\n");
    }

    // Check users count (if table exists)
    try {
      const userCount = await prisma.user.count();
      console.log(`6. Verificando dados...`);
      console.log(`   ✅ ${userCount} utilizador(es) na base de dados\n`);
    } catch (error) {
      console.log("   ⚠️  Tabela User não existe. Execute migrations primeiro.\n");
    }

    console.log("✅ Verificação concluída com sucesso!");
    console.log("\n💡 Próximos passos:");
    console.log("   - Se não há tabelas: npm run db:migrate:deploy");
    console.log("   - Se não há dados: npm run db:seed:staging");
  } catch (error) {
    console.error("❌ Erro ao verificar base de dados:");
    console.error(`   ${error.message}\n`);

    if (error.message.includes("P1001")) {
      console.error("💡 Dica: Verifique se:");
      console.error("   - DATABASE_URL está correto");
      console.error("   - O servidor de base de dados está acessível");
      console.error("   - O seu IP está na whitelist (se aplicável)");
      console.error("   - As credenciais estão corretas");
    } else if (error.message.includes("SSL")) {
      console.error("💡 Dica: Adicione ?sslmode=require ao DATABASE_URL");
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();

