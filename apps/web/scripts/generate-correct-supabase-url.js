/**
 * Script para gerar URL correta do Supabase Connection Pooler
 * baseado no DIRECT_URL
 */

const directUrl = process.env.DIRECT_URL;

if (!directUrl) {
  console.error("❌ DIRECT_URL não está definido");
  console.error("   Configure DIRECT_URL primeiro");
  process.exit(1);
}

console.log("🔧 Gerando URL correta do Connection Pooler...\n");

// Extrair informações do DIRECT_URL
const projectRefMatch = directUrl.match(/db\.([^.]+)\.supabase\.co/);
const passwordMatch = directUrl.match(/postgres:([^@]+)@/);

if (!projectRefMatch || !passwordMatch) {
  console.error("❌ Não foi possível extrair informações do DIRECT_URL");
  console.error("   Verifique se o formato está correto");
  process.exit(1);
}

const projectRef = projectRefMatch[1];
const password = passwordMatch[1];

// Tentar detectar região (padrão: eu-central-1)
let region = "eu-central-1";
const regionMatch = directUrl.match(/aws-[01]-([^.]+)\.pooler/);
if (regionMatch) {
  region = regionMatch[1];
}

console.log("📊 Informações extraídas:");
console.log(`   Project REF: ${projectRef}`);
console.log(`   Region: ${region} (assumido, verificar no dashboard)\n`);

// Gerar URLs
console.log("✅ URLs geradas:\n");

console.log("1️⃣  DATABASE_URL (Connection Pooler - porta 6543):");
console.log(`DATABASE_URL="postgresql://postgres.${projectRef}:${password}@aws-0-${region}.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"`);

console.log("\n2️⃣  DIRECT_URL (já configurado):");
console.log(`DIRECT_URL="${directUrl}"`);

console.log("\n💡 Próximos passos:");
console.log("   1. Copiar a DATABASE_URL acima");
console.log("   2. Editar apps/web/.env");
console.log("   3. Substituir a DATABASE_URL atual");
console.log("   4. Testar: npm run db:test:supabase\n");

console.log("⚠️  Nota: Se a região estiver incorreta, verificar no Supabase Dashboard:");
console.log("   Settings → Database → Connection string → Ver região\n");

