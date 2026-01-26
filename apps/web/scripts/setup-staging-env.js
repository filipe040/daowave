/**
 * Script para configurar ambiente staging
 * Cria/atualiza .env com configurações específicas de staging
 * 
 * Usage: node scripts/setup-staging-env.js
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

async function setupStaging() {
  console.log("🚀 Configuração de Ambiente STAGING (BETA)\n");
  console.log("Este script vai ajudar a configurar todas as variáveis necessárias para staging.\n");

  const envFile = path.join(__dirname, "..", ".env");
  let envContent = "";

  // Read existing .env if it exists
  if (fs.existsSync(envFile)) {
    envContent = fs.readFileSync(envFile, "utf8");
    console.log("✅ Arquivo .env encontrado, atualizando...\n");
  } else {
    console.log("📝 Criando novo arquivo .env...\n");
  }

  // Set NODE_ENV to staging
  if (envContent.includes("NODE_ENV=")) {
    envContent = envContent.replace(/NODE_ENV\s*=.*/g, "NODE_ENV=staging");
  } else {
    envContent = "NODE_ENV=staging\n" + envContent;
  }

  console.log("1️⃣  Database (Supabase Staging)\n");
  const databaseUrl = await question("   DATABASE_URL (Connection Pooler): ");
  const directUrl = await question("   DIRECT_URL (para migrations): ");

  if (envContent.includes("DATABASE_URL=")) {
    envContent = envContent.replace(/DATABASE_URL\s*=.*/g, `DATABASE_URL="${databaseUrl}"`);
  } else {
    envContent += `\n# Database - Supabase Staging\nDATABASE_URL="${databaseUrl}"\n`;
  }

  if (envContent.includes("DIRECT_URL=")) {
    envContent = envContent.replace(/DIRECT_URL\s*=.*/g, `DIRECT_URL="${directUrl}"`);
  } else {
    envContent += `DIRECT_URL="${directUrl}"\n`;
  }

  console.log("\n2️⃣  Authentication\n");
  const nextAuthSecret = await question("   NEXTAUTH_SECRET (mínimo 32 caracteres): ");
  const nextAuthUrl = await question("   NEXTAUTH_URL (ex: https://staging.7eventickets.pt): ");

  if (envContent.includes("NEXTAUTH_SECRET=")) {
    envContent = envContent.replace(/NEXTAUTH_SECRET\s*=.*/g, `NEXTAUTH_SECRET=${nextAuthSecret}`);
  } else {
    envContent += `\n# Authentication\nNEXTAUTH_SECRET=${nextAuthSecret}\n`;
  }

  if (envContent.includes("NEXTAUTH_URL=")) {
    envContent = envContent.replace(/NEXTAUTH_URL\s*=.*/g, `NEXTAUTH_URL=${nextAuthUrl}`);
  } else {
    envContent += `NEXTAUTH_URL=${nextAuthUrl}\n`;
  }

  console.log("\n3️⃣  QR Secret\n");
  const qrSecret = await question("   QR_SECRET (mínimo 32 caracteres): ");

  if (envContent.includes("QR_SECRET=")) {
    envContent = envContent.replace(/QR_SECRET\s*=.*/g, `QR_SECRET=${qrSecret}`);
  } else {
    envContent += `QR_SECRET=${qrSecret}\n`;
  }

  console.log("\n4️⃣  Payments (Stripe TEST Mode)\n");
  console.log("   ⚠️  IMPORTANTE: Use apenas chaves de TEST em staging!\n");
  const stripeSecret = await question("   STRIPE_SECRET_KEY (sk_test_...): ");
  const stripeWebhook = await question("   STRIPE_WEBHOOK_SECRET (whsec_...): ");

  if (envContent.includes("STRIPE_SECRET_KEY=")) {
    envContent = envContent.replace(/STRIPE_SECRET_KEY\s*=.*/g, `STRIPE_SECRET_KEY=${stripeSecret}`);
  } else {
    envContent += `\n# Payments - Stripe TEST Mode\nSTRIPE_SECRET_KEY=${stripeSecret}\n`;
  }

  if (envContent.includes("STRIPE_WEBHOOK_SECRET=")) {
    envContent = envContent.replace(/STRIPE_WEBHOOK_SECRET\s*=.*/g, `STRIPE_WEBHOOK_SECRET=${stripeWebhook}`);
  } else {
    envContent += `STRIPE_WEBHOOK_SECRET=${stripeWebhook}\n`;
  }

  // Set feature flags for staging
  if (!envContent.includes("ENABLE_MOCK_PAYMENTS=")) {
    envContent += `\n# Feature Flags\nENABLE_MOCK_PAYMENTS=false\n`;
  }
  if (!envContent.includes("ENABLE_REAL_PAYMENTS=")) {
    envContent += `ENABLE_REAL_PAYMENTS=true\n`;
  }
  // Banner BETA será mostrado automaticamente em staging

  // Write to .env
  fs.writeFileSync(envFile, envContent, "utf8");

  console.log("\n✅ Configuração de staging concluída!\n");
  console.log("📋 Próximos passos:");
  console.log("   1. Aplicar migrations: npm run db:migrate:deploy");
  console.log("   2. Seed staging: npm run db:seed:staging");
  console.log("   3. Verificar: npm run db:check");
  console.log("   4. Iniciar app: npm run dev");
  console.log("\n💡 O banner BETA aparecerá automaticamente em staging!\n");

  rl.close();
}

setupStaging().catch((error) => {
  console.error("❌ Erro:", error.message);
  rl.close();
  process.exit(1);
});

