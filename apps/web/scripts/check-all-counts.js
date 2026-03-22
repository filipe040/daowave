const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const models = Object.keys(prisma).filter(k => k[0] !== '_' && typeof prisma[k] === 'object' && prisma[k].count);
  const results = {};
  for (const model of models) {
    try {
      results[model] = await prisma[model].count();
    } catch (e) {}
  }
  console.log(JSON.stringify(results, null, 2));
}

main().finally(() => prisma.$disconnect());
