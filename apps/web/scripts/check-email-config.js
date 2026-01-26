const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Verificando configuração de emails...\n");

  // Check environment variables
  const envVars = {
    EMAIL_PROVIDER_KEY: process.env.EMAIL_PROVIDER_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    BETA_EMAILS_ENABLED: process.env.BETA_EMAILS_ENABLED,
    BETA_EMAIL_ALLOWLIST: process.env.BETA_EMAIL_ALLOWLIST,
  };

  console.log("📋 Variáveis de Ambiente:");
  Object.entries(envVars).forEach(([key, value]) => {
    if (key === "EMAIL_PROVIDER_KEY" && value) {
      const masked = value.substring(0, 5) + "..." + value.substring(value.length - 4);
      console.log(`   ${key}: ${masked}`);
    } else {
      console.log(`   ${key}: ${value || "❌ não configurado"}`);
    }
  });

  // Check database
  console.log("\n📊 Base de Dados:");
  try {
    const allowlistCount = await prisma.betaAllowlist.count();
    console.log(`   BetaAllowlist: ${allowlistCount} emails`);

    const emailLogCount = await prisma.emailLog.count();
    console.log(`   EmailLog: ${emailLogCount} registos`);

    const recentLogs = await prisma.emailLog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        type: true,
        to: true,
        status: true,
        createdAt: true,
      },
    });

    if (recentLogs.length > 0) {
      console.log("\n📧 Últimos emails:");
      recentLogs.forEach((log) => {
        const statusEmoji = {
          SENT: "✅",
          FAILED: "❌",
          BLOCKED: "🚫",
          DISABLED: "⏸️",
          PENDING: "⏳",
        }[log.status] || "❓";
        console.log(`   ${statusEmoji} ${log.type} → ${log.to} (${log.status})`);
      });
    }
  } catch (error) {
    console.error("   ❌ Erro ao verificar base de dados:", error.message);
  }

  // Check provider
  console.log("\n🔌 Provider:");
  if (envVars.EMAIL_PROVIDER_KEY) {
    if (envVars.EMAIL_PROVIDER_KEY.startsWith("re_")) {
      console.log("   ✅ Resend detectado");
    } else if (envVars.EMAIL_PROVIDER_KEY.startsWith("SG.")) {
      console.log("   ✅ SendGrid detectado");
    } else {
      console.log("   ⚠️  Provider desconhecido (deve começar com 're_' ou 'SG.')");
    }
  } else {
    console.log("   ❌ EMAIL_PROVIDER_KEY não configurado");
  }

  // Summary
  console.log("\n📝 Resumo:");
  const issues = [];
  if (!envVars.EMAIL_PROVIDER_KEY) issues.push("EMAIL_PROVIDER_KEY não configurado");
  if (!envVars.EMAIL_FROM) issues.push("EMAIL_FROM não configurado");
  if (envVars.BETA_EMAILS_ENABLED !== "true" && envVars.BETA_EMAILS_ENABLED !== "false") {
    issues.push("BETA_EMAILS_ENABLED não configurado");
  }

  if (issues.length === 0) {
    console.log("   ✅ Configuração parece correta");
  } else {
    console.log("   ⚠️  Problemas encontrados:");
    issues.forEach((issue) => console.log(`      - ${issue}`));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

