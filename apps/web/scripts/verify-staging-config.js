/**
 * Script para verificar configuração de staging
 * Usage: NODE_ENV=staging node scripts/verify-staging-config.js
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function verifyStaging() {
  console.log("🔍 Verificando configuração de STAGING...\n");

  const nodeEnv = process.env.NODE_ENV;
  const isStaging = nodeEnv === "staging";

  if (!isStaging) {
    console.warn("⚠️  NODE_ENV não está definido como 'staging'");
    console.warn(`   Valor atual: ${nodeEnv || "não definido"}`);
    console.warn("   Para staging, definir: NODE_ENV=staging\n");
  } else {
    console.log("✅ NODE_ENV=staging\n");
  }

  // Check database
  console.log("1️⃣  Database:");
  const dbUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;

  if (!dbUrl) {
    console.error("   ❌ DATABASE_URL não definido\n");
  } else {
    console.log("   ✅ DATABASE_URL configurado");
    if (dbUrl.includes("supabase.com")) {
      console.log("   ✅ Usando Supabase");
    }
  }

  if (!directUrl) {
    console.warn("   ⚠️  DIRECT_URL não definido (recomendado para migrations)\n");
  } else {
    console.log("   ✅ DIRECT_URL configurado\n");
  }

  // Check Stripe (must be TEST mode in staging)
  console.log("2️⃣  Payments (Stripe):");
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeKey) {
    console.warn("   ⚠️  STRIPE_SECRET_KEY não definido\n");
  } else if (stripeKey.startsWith("sk_test_")) {
    console.log("   ✅ Stripe TEST mode (correto para staging)");
  } else if (stripeKey.startsWith("sk_live_")) {
    console.error("   ❌ Stripe LIVE mode detectado!");
    console.error("   ⚠️  STAGING deve usar apenas chaves TEST (sk_test_...)\n");
  } else {
    console.warn("   ⚠️  Chave Stripe inválida ou placeholder\n");
  }

  // Check email
  console.log("3️⃣  Email:");
  const smtpUser = process.env.SMTP_USER;
  if (smtpUser) {
    console.log("   ✅ SMTP configurado");
    console.log("   ℹ️  Emails serão marcados como [BETA] automaticamente\n");
  } else {
    console.warn("   ⚠️  SMTP não configurado (emails não serão enviados)\n");
  }

  // Check secrets
  console.log("4️⃣  Secrets:");
  const nextAuthSecret = process.env.NEXTAUTH_SECRET;
  const qrSecret = process.env.QR_SECRET;

  if (!nextAuthSecret || nextAuthSecret.length < 32) {
    console.error("   ❌ NEXTAUTH_SECRET inválido (mínimo 32 caracteres)\n");
  } else {
    console.log("   ✅ NEXTAUTH_SECRET válido");
  }

  if (!qrSecret || qrSecret.length < 32) {
    console.error("   ❌ QR_SECRET inválido (mínimo 32 caracteres)\n");
  } else {
    console.log("   ✅ QR_SECRET válido\n");
  }

  // Test database connection
  console.log("5️⃣  Testando conexão com database...");
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log("   ✅ Conexão estabelecida\n");
  } catch (error) {
    console.error(`   ❌ Erro: ${error.message}\n`);
  }

  // Summary
  console.log("📊 Resumo:\n");
  console.log(`   Ambiente: ${nodeEnv || "não definido"}`);
  console.log(`   Database: ${dbUrl ? "✅" : "❌"}`);
  console.log(`   Stripe: ${stripeKey?.startsWith("sk_test_") ? "✅ TEST" : stripeKey ? "⚠️" : "❌"}`);
  console.log(`   Email: ${smtpUser ? "✅" : "⚠️"}`);
  console.log(`   Secrets: ${nextAuthSecret && qrSecret ? "✅" : "❌"}\n`);

  if (isStaging && stripeKey?.startsWith("sk_test_") && dbUrl && nextAuthSecret && qrSecret) {
    console.log("✅ Configuração de staging parece correta!\n");
    console.log("💡 Próximos passos:");
    console.log("   1. Aplicar migrations: npm run db:migrate:deploy");
    console.log("   2. Seed staging: npm run db:seed:staging");
    console.log("   3. Iniciar app: npm run dev");
    console.log("   4. Verificar banner BETA no frontend\n");
  } else {
    console.log("⚠️  Algumas configurações precisam ser ajustadas.\n");
  }

  await prisma.$disconnect();
}

verifyStaging().catch((error) => {
  console.error("❌ Erro:", error.message);
  process.exit(1);
});

