/**
 * Script para configurar variáveis de ambiente do Supabase
 * Usage: node scripts/configure-supabase-env.js
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function configureSupabase() {
  console.log("🔧 Configuração de Variáveis Supabase\n");
  console.log("Este script vai ajudar a configurar DATABASE_URL e DIRECT_URL\n");

  // Get DATABASE_URL (runtime)
  console.log("1️⃣  DATABASE_URL (usado pela aplicação em runtime)");
  console.log("   Encontre em: Supabase Dashboard → Settings → Database → Connection string → URI");
  console.log("   Use a URL do Connection Pooler (porta 5432 ou 6543)\n");
  
  const databaseUrl = await question("   DATABASE_URL: ");

  if (!databaseUrl || !databaseUrl.includes("supabase.com")) {
    console.error("\n❌ DATABASE_URL inválido ou não é do Supabase");
    rl.close();
    process.exit(1);
  }

  // Get DIRECT_URL (migrations)
  console.log("\n2️⃣  DIRECT_URL (usado apenas para migrations)");
  console.log("   Encontre em: Supabase Dashboard → Settings → Database → Connection string → Session mode");
  console.log("   Use a URL direta (db.xxx.supabase.co:5432)\n");
  
  const directUrl = await question("   DIRECT_URL: ");

  if (!directUrl || !directUrl.includes("supabase.co")) {
    console.error("\n❌ DIRECT_URL inválido ou não é do Supabase");
    rl.close();
    process.exit(1);
  }

  // Check if .env exists
  const envPath = path.join(__dirname, "..", ".env");
  let envContent = "";

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf8");
    console.log("\n✅ Arquivo .env encontrado, atualizando...\n");
  } else {
    console.log("\n📝 Criando novo arquivo .env...\n");
  }

  // Update or add DATABASE_URL
  if (envContent.includes("DATABASE_URL=")) {
    envContent = envContent.replace(/DATABASE_URL=.*/g, `DATABASE_URL="${databaseUrl}"`);
  } else {
    envContent += `\n# Database\nDATABASE_URL="${databaseUrl}"\n`;
  }

  // Update or add DIRECT_URL
  if (envContent.includes("DIRECT_URL=")) {
    envContent = envContent.replace(/DIRECT_URL=.*/g, `DIRECT_URL="${directUrl}"`);
  } else {
    envContent += `DIRECT_URL="${directUrl}"\n`;
  }

  // Write to .env
  fs.writeFileSync(envPath, envContent, "utf8");

  console.log("✅ Variáveis configuradas com sucesso!\n");
  console.log("📋 Próximos passos:");
  console.log("   1. Verificar configuração: npm run db:verify:supabase");
  console.log("   2. Testar conexão: npm run db:test");
  console.log("   3. Aplicar migrations: npm run db:migrate:deploy");
  console.log("   4. Seed (opcional): npm run db:seed:staging\n");

  rl.close();
}

configureSupabase().catch((error) => {
  console.error("❌ Erro:", error.message);
  rl.close();
  process.exit(1);
});

