/**
 * Script simples para testar conexão com base de dados
 * Usage: DATABASE_URL=... node scripts/test-db-connection.js
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  log: ["error", "warn"],
});

async function testConnection() {
  try {
    console.log("🔍 Testando conexão...");
    
    await prisma.$connect();
    console.log("✅ Conexão estabelecida!");

    const result = await prisma.$queryRaw`SELECT NOW() as current_time, version() as version`;
    console.log("\n📊 Informações da base de dados:");
    console.log(`   Hora atual: ${result[0].current_time}`);
    console.log(`   Versão: ${result[0].version.split(",")[0]}`);

    await prisma.$disconnect();
    console.log("\n✅ Teste concluído com sucesso!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Erro ao conectar:");
    console.error(`   ${error.message}\n`);

    if (error.message.includes("P1001")) {
      console.error("💡 Possíveis causas:");
      console.error("   - DATABASE_URL incorreto");
      console.error("   - Servidor não acessível");
      console.error("   - IP não está na whitelist");
      console.error("   - Credenciais incorretas");
    } else if (error.message.includes("SSL")) {
      console.error("💡 Adicione ?sslmode=require ao DATABASE_URL");
    } else if (error.message.includes("does not exist")) {
      console.error("💡 A base de dados não existe. Crie-a primeiro no provider.");
    }

    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  }
}

testConnection();

