/**
 * Script para verificar configuração específica do Supabase
 * Usage: DATABASE_URL=... node scripts/verify-supabase-config.js
 */

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("❌ DATABASE_URL não está definido");
  process.exit(1);
}

console.log("🔍 Verificando configuração Supabase...\n");

const checks = {
  isSupabase: dbUrl.includes("supabase.com"),
  hasPooler: dbUrl.includes("pooler.supabase.com") || dbUrl.includes(":6543"),
  hasPgbouncer: dbUrl.includes("pgbouncer=true"),
  hasConnectionLimit: dbUrl.includes("connection_limit"),
  hasSSL: dbUrl.includes("sslmode"),
  isSessionMode: dbUrl.includes(":5432") && !dbUrl.includes("pooler"),
};

console.log("📊 Análise da DATABASE_URL:\n");

console.log(`   É Supabase: ${checks.isSupabase ? "✅" : "❌"}`);
console.log(`   Connection Pooler: ${checks.hasPooler ? "✅" : "⚠️  (usando Session Mode)"}`);
console.log(`   PgBouncer: ${checks.hasPgbouncer ? "✅" : "⚠️  (recomendado adicionar)"}`);
console.log(`   Connection Limit: ${checks.hasConnectionLimit ? "✅" : "⚠️  (recomendado adicionar)"}`);
console.log(`   SSL: ${checks.hasSSL ? "✅" : "⚠️  (SSL automático, mas pode forçar)"}`);
console.log(`   Session Mode: ${checks.isSessionMode ? "✅ (OK para migrations)" : "❌"}`);

console.log("\n💡 Recomendações:\n");

if (!checks.isSupabase) {
  console.log("   ⚠️  DATABASE_URL não parece ser do Supabase");
}

if (checks.isSessionMode && !checks.hasPooler) {
  console.log("   💡 Para produção, usar Connection Pooler:");
  console.log("      Trocar porta 5432 por 6543");
  console.log("      Adicionar ?pgbouncer=true&connection_limit=1");
}

if (!checks.hasPgbouncer && checks.hasPooler) {
  console.log("   💡 Adicionar ?pgbouncer=true ao DATABASE_URL");
}

if (!checks.hasConnectionLimit) {
  console.log("   💡 Adicionar &connection_limit=1 ao DATABASE_URL");
  console.log("      Limita conexões e melhora performance");
}

console.log("\n📝 Exemplo de DATABASE_URL otimizado para produção:\n");
console.log("   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1\n");

console.log("📝 Exemplo de DATABASE_URL para migrations:\n");
console.log("   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres\n");

