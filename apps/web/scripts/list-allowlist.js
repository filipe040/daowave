const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    const emails = await prisma.betaAllowlist.findMany({
      orderBy: { email: "asc" },
    });

    if (emails.length === 0) {
      console.log("📋 Allowlist vazia");
      console.log("   Use: node add-to-allowlist.js <email> para adicionar emails");
    } else {
      console.log(`📋 Allowlist (${emails.length} emails):`);
      emails.forEach((e) => {
        const status = e.enabled ? "✅ ativo" : "❌ inativo";
        console.log(`   - ${e.email} (${status})`);
      });
    }
  } catch (error) {
    console.error("❌ Erro ao listar allowlist:", error.message);
    process.exit(1);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

