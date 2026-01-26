/**
 * Script para testar ambas as conexões Supabase (DATABASE_URL e DIRECT_URL)
 * Usage: node scripts/test-supabase-connection.js
 */

const { PrismaClient } = require("@prisma/client");

async function testConnections() {
  console.log("🔍 Testando conexões Supabase...\n");

  const databaseUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;

  if (!databaseUrl) {
    console.error("❌ DATABASE_URL não está definido");
    process.exit(1);
  }

  if (!directUrl) {
    console.warn("⚠️  DIRECT_URL não está definido");
    console.warn("   Migrations podem falhar. Configure DIRECT_URL para migrations.\n");
  }

  // Test DATABASE_URL (runtime)
  console.log("1️⃣  Testando DATABASE_URL (runtime)...");
  const runtimeClient = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  try {
    await runtimeClient.$connect();
    const version = await runtimeClient.$queryRaw`SELECT version()`;
    console.log(`   ✅ Conexão estabelecida`);
    console.log(`   ✅ PostgreSQL ${version[0].version.match(/PostgreSQL (\d+\.\d+)/)?.[1]}\n`);
    await runtimeClient.$disconnect();
  } catch (error) {
    console.error(`   ❌ Erro: ${error.message}\n`);
    await runtimeClient.$disconnect().catch(() => {});
  }

  // Test DIRECT_URL (migrations)
  if (directUrl) {
    console.log("2️⃣  Testando DIRECT_URL (migrations)...");
    const migrationClient = new PrismaClient({
      datasources: {
        db: {
          url: directUrl,
        },
      },
    });

    try {
      await migrationClient.$connect();
      const version = await migrationClient.$queryRaw`SELECT version()`;
      console.log(`   ✅ Conexão estabelecida`);
      console.log(`   ✅ PostgreSQL ${version[0].version.match(/PostgreSQL (\d+\.\d+)/)?.[1]}\n`);
      await migrationClient.$disconnect();
    } catch (error) {
      console.error(`   ❌ Erro: ${error.message}\n`);
      await migrationClient.$disconnect().catch(() => {});
    }
  }

  // Summary
  console.log("📊 Resumo:\n");
  console.log(`   DATABASE_URL: ${databaseUrl.includes("pooler") ? "✅ Connection Pooler" : "⚠️  Session Mode"}`);
  console.log(`   DIRECT_URL: ${directUrl ? "✅ Configurado" : "❌ Não configurado"}\n`);

  if (!directUrl) {
    console.log("💡 Configure DIRECT_URL para migrations:");
    console.log("   DIRECT_URL=\"postgresql://postgres.[REF]:[PASSWORD]@db.[REF].supabase.co:5432/postgres?sslmode=require\"\n");
  }

  console.log("✅ Teste concluído!");
}

testConnections().catch((error) => {
  console.error("❌ Erro:", error.message);
  process.exit(1);
});

