const { PrismaClient } = require("@prisma/client");
const path = require('path');
const fs = require('fs');

// Load .env from root
const rootEnv = path.join(__dirname, '../../.env');
if (fs.existsSync(rootEnv)) {
  const envContent = fs.readFileSync(rootEnv, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || "vascomelo2007@gmail.com";
  const normalizedEmail = email.toLowerCase().trim();

  console.log(`\n✅ Aprovando perfil de organizador...`);
  console.log(`   Email: ${normalizedEmail}`);
  console.log("");

  try {
    await prisma.$connect();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        organizerProfile: true,
      },
    });

    if (!user) {
      console.error(`❌ Usuário não encontrado`);
      process.exit(1);
    }

    if (!user.organizerProfile) {
      console.error(`❌ Usuário não tem perfil de organizador`);
      process.exit(1);
    }

    if (user.organizerProfile.status === "APPROVED") {
      console.log(`✅ Perfil já está aprovado!`);
      process.exit(0);
    }

    await prisma.organizerProfile.update({
      where: { id: user.organizerProfile.id },
      data: {
        status: "APPROVED",
      },
    });

    console.log(`✅ Perfil de organizador aprovado com sucesso!`);
    console.log(`   Marca: ${user.organizerProfile.brandName}`);
    console.log(`   Status: APPROVED`);

  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

