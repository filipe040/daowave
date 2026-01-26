const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("❌ Uso: node add-to-allowlist.js <email>");
    console.error("   Exemplo: node add-to-allowlist.js beta@example.com");
    process.exit(1);
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    const result = await prisma.betaAllowlist.upsert({
      where: { email: normalizedEmail },
      update: { enabled: true },
      create: {
        email: normalizedEmail,
        enabled: true,
      },
    });

    console.log(`✅ Email ${normalizedEmail} adicionado à allowlist`);
    console.log(`   ID: ${result.id}`);
    console.log(`   Enabled: ${result.enabled}`);
  } catch (error) {
    console.error("❌ Erro ao adicionar email à allowlist:", error.message);
    process.exit(1);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

