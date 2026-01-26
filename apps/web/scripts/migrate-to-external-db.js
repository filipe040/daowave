/**
 * Script para migrar dados de base de dados local para externa
 * 
 * Usage:
 *   LOCAL_DB_URL=postgresql://local... EXTERNAL_DB_URL=postgresql://external... node scripts/migrate-to-external-db.js
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const LOCAL_DB_URL = process.env.LOCAL_DB_URL || process.env.DATABASE_URL;
const EXTERNAL_DB_URL = process.env.EXTERNAL_DB_URL;

if (!LOCAL_DB_URL) {
  console.error("❌ LOCAL_DB_URL ou DATABASE_URL não definido");
  console.error("   Usage: LOCAL_DB_URL=... EXTERNAL_DB_URL=... node scripts/migrate-to-external-db.js");
  process.exit(1);
}

if (!EXTERNAL_DB_URL) {
  console.error("❌ EXTERNAL_DB_URL não definido");
  console.error("   Usage: LOCAL_DB_URL=... EXTERNAL_DB_URL=... node scripts/migrate-to-external-db.js");
  process.exit(1);
}

async function migrateDatabase() {
  const backupFile = path.join(__dirname, `backup-${Date.now()}.sql`);

  try {
    console.log("🔄 Iniciando migração de dados...\n");

    // Step 1: Export from local
    console.log("1. Exportando dados da base de dados local...");
    try {
      execSync(`pg_dump "${LOCAL_DB_URL}" > "${backupFile}"`, {
        stdio: "inherit",
        shell: true,
      });
      console.log(`   ✅ Dados exportados para ${backupFile}\n`);
    } catch (error) {
      console.error("   ❌ Erro ao exportar dados:");
      console.error(`   ${error.message}\n`);
      console.error("💡 Certifique-se de que pg_dump está instalado e LOCAL_DB_URL está correto");
      process.exit(1);
    }

    // Step 2: Import to external
    console.log("2. Importando dados para base de dados externa...");
    try {
      execSync(`psql "${EXTERNAL_DB_URL}" < "${backupFile}"`, {
        stdio: "inherit",
        shell: true,
      });
      console.log("   ✅ Dados importados com sucesso\n");
    } catch (error) {
      console.error("   ❌ Erro ao importar dados:");
      console.error(`   ${error.message}\n`);
      console.error("💡 Verifique se:");
      console.error("   - EXTERNAL_DB_URL está correto");
      console.error("   - O servidor externo está acessível");
      console.error("   - O seu IP está na whitelist");
      console.error("   - As migrations foram aplicadas na DB externa");
      process.exit(1);
    }

    // Step 3: Cleanup
    console.log("3. Limpando arquivo temporário...");
    try {
      fs.unlinkSync(backupFile);
      console.log("   ✅ Arquivo removido\n");
    } catch (error) {
      console.warn(`   ⚠️  Não foi possível remover ${backupFile}`);
      console.warn(`   Pode removê-lo manualmente\n`);
    }

    console.log("✅ Migração concluída com sucesso!");
    console.log("\n💡 Próximos passos:");
    console.log("   - Verificar dados: node scripts/check-external-db.js");
    console.log("   - Atualizar DATABASE_URL para usar a base de dados externa");
  } catch (error) {
    console.error("❌ Erro durante migração:");
    console.error(error.message);
    
    // Cleanup on error
    if (fs.existsSync(backupFile)) {
      try {
        fs.unlinkSync(backupFile);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    
    process.exit(1);
  }
}

migrateDatabase();

