/**
 * Script para verificar e corrigir URLs do Supabase
 * Usage: node scripts/fix-supabase-url.js
 */

const dbUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;

console.log("🔍 Analisando URLs do Supabase...\n");

if (!dbUrl) {
  console.error("❌ DATABASE_URL não está definido");
  process.exit(1);
}

if (!directUrl) {
  console.error("❌ DIRECT_URL não está definido");
  process.exit(1);
}

console.log("📊 URLs atuais:\n");

// Analisar DATABASE_URL
console.log("1️⃣  DATABASE_URL:");
console.log(`   ${dbUrl}\n`);

const dbIssues = [];
if (!dbUrl.includes("pooler.supabase.com")) {
  dbIssues.push("⚠️  Não parece ser URL do Connection Pooler");
}
if (!dbUrl.includes("pgbouncer=true")) {
  dbIssues.push("⚠️  Falta ?pgbouncer=true");
}
if (!dbUrl.includes("connection_limit")) {
  dbIssues.push("⚠️  Falta &connection_limit=1");
}
if (dbUrl.includes("aws-1-")) {
  dbIssues.push("⚠️  Usando 'aws-1-' - pode ser que precise de 'aws-0-'");
}

if (dbIssues.length > 0) {
  console.log("   Problemas encontrados:");
  dbIssues.forEach(issue => console.log(`   ${issue}`));
} else {
  console.log("   ✅ Formato parece correto");
}

console.log("\n2️⃣  DIRECT_URL:");
console.log(`   ${directUrl}\n`);

const directIssues = [];
if (!directUrl.includes("db.") || !directUrl.includes(".supabase.co")) {
  directIssues.push("⚠️  Não parece ser URL direta do Supabase");
}
if (!directUrl.includes("sslmode=require")) {
  directIssues.push("⚠️  Falta ?sslmode=require");
}

if (directIssues.length > 0) {
  console.log("   Problemas encontrados:");
  directIssues.forEach(issue => console.log(`   ${issue}`));
} else {
  console.log("   ✅ Formato parece correto");
}

// Sugestões de correção
console.log("\n💡 Sugestões de correção:\n");

if (dbUrl.includes("aws-1-")) {
  console.log("   O erro 'Tenant or user not found' pode ser causado por:");
  console.log("   - URL do pooler incorreta");
  console.log("   - Tentar usar a mesma URL do DIRECT_URL mas com pooler\n");
  
  console.log("   Opção 1: Usar Connection Pooler na porta 6543:");
  const projectRef = directUrl.match(/db\.([^.]+)\.supabase\.co/)?.[1];
  const password = directUrl.match(/postgres:([^@]+)@/)?.[1];
  const region = dbUrl.match(/aws-[01]-([^.]+)\.pooler/)?.[1] || "eu-central-1";
  
  if (projectRef && password) {
    console.log(`   DATABASE_URL="postgresql://postgres.${projectRef}:${password}@aws-0-${region}.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"`);
  }
  
  console.log("\n   Opção 2: Usar Session Mode (porta 5432) temporariamente:");
  console.log(`   DATABASE_URL="${directUrl}"`);
  
  console.log("\n   Opção 3: Verificar no Supabase Dashboard:");
  console.log("   - Settings → Database → Connection string");
  console.log("   - Usar a URL do 'Connection Pooler' (não Session mode)");
  console.log("   - Verificar que está usando a porta correta (6543 para pooler)");
}

console.log("\n📝 Para testar após correção:");
console.log("   npm run db:test:supabase\n");

