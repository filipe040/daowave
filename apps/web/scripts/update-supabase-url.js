/**
 * Script para atualizar DATABASE_URL com a URL correta do Supabase Connection Pooler
 */

const fs = require("fs");
const path = require("path");

const envFile = path.join(__dirname, "..", ".env");

// URL correta do Connection Pooler (com password já conhecida)
const correctDatabaseUrl = 'postgresql://postgres.nuhpkhgimkadoowqdmsl:f3lkwGTtPmQpgc6d@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1';
const directUrl = 'postgresql://postgres:f3lkwGTtPmQpgc6d@db.nuhpkhgimkadoowqdmsl.supabase.co:5432/postgres?sslmode=require';

console.log("🔧 Atualizando DATABASE_URL no .env...\n");

if (!fs.existsSync(envFile)) {
  console.error("❌ Arquivo .env não encontrado em:", envFile);
  console.error("   Criando novo arquivo .env...\n");
  
  // Criar arquivo .env com as URLs
  const content = `# Database - Supabase
# USADO PELA APP (runtime) - Connection Pooler
DATABASE_URL="${correctDatabaseUrl}"

# USADO APENAS PARA MIGRATIONS - Conexão Direta
DIRECT_URL="${directUrl}"
`;
  
  fs.writeFileSync(envFile, content, "utf8");
  console.log("✅ Arquivo .env criado com URLs corretas!\n");
} else {
  // Ler conteúdo atual
  let content = fs.readFileSync(envFile, "utf8");
  
  // Atualizar DATABASE_URL
  if (content.includes("DATABASE_URL=")) {
    content = content.replace(/DATABASE_URL\s*=.*/g, `DATABASE_URL="${correctDatabaseUrl}"`);
    console.log("✅ DATABASE_URL atualizada");
  } else {
    if (!content.endsWith("\n")) content += "\n";
    content += `\n# Database - Supabase\nDATABASE_URL="${correctDatabaseUrl}"\n`;
    console.log("✅ DATABASE_URL adicionada");
  }
  
  // Atualizar DIRECT_URL
  if (content.includes("DIRECT_URL=")) {
    content = content.replace(/DIRECT_URL\s*=.*/g, `DIRECT_URL="${directUrl}"`);
    console.log("✅ DIRECT_URL atualizada");
  } else {
    content += `DIRECT_URL="${directUrl}"\n`;
    console.log("✅ DIRECT_URL adicionada");
  }
  
  // Escrever de volta
  fs.writeFileSync(envFile, content, "utf8");
  console.log("\n✅ Arquivo .env atualizado!\n");
}

console.log("📋 URLs configuradas:\n");
console.log(`DATABASE_URL="${correctDatabaseUrl}"`);
console.log(`DIRECT_URL="${directUrl}"`);
console.log("\n💡 Próximos passos:");
console.log("   1. Testar conexões: npm run db:test:supabase");
console.log("   2. Aplicar migrations: npm run db:migrate:deploy");
console.log("   3. Seed (opcional): npm run db:seed:staging\n");

