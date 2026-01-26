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
  const brandName = process.argv[3] || "Meu Negócio";
  const normalizedEmail = email.toLowerCase().trim();

  console.log(`\n🔄 Convertendo usuário para promotor...`);
  console.log(`   Email: ${normalizedEmail}`);
  console.log(`   Nome da marca: ${brandName}`);
  console.log("");

  try {
    await prisma.$connect();
    console.log(`✅ Conectado ao banco de dados`);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        organizerProfile: true,
      },
    });

    if (!user) {
      console.error(`❌ Usuário não encontrado: ${normalizedEmail}`);
      process.exit(1);
    }

    console.log(`📋 Usuário encontrado:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Nome: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role atual: ${user.role}`);

    // Update user role to ORGANIZER
    if (user.role !== "ORGANIZER") {
      console.log(`\n🔄 Atualizando role para ORGANIZER...`);
      await prisma.user.update({
        where: { id: user.id },
        data: { role: "ORGANIZER" },
      });
      console.log(`   ✅ Role atualizado para ORGANIZER`);
    } else {
      console.log(`   ✅ Usuário já é ORGANIZER`);
    }

    // Create or update organizer profile
    if (user.organizerProfile) {
      console.log(`\n📋 Perfil de organizador já existe:`);
      console.log(`   ID: ${user.organizerProfile.id}`);
      console.log(`   Marca: ${user.organizerProfile.brandName}`);
      console.log(`   Status: ${user.organizerProfile.status}`);

      // Update brand name if different
      if (user.organizerProfile.brandName !== brandName) {
        console.log(`\n🔄 Atualizando nome da marca...`);
        await prisma.organizerProfile.update({
          where: { id: user.organizerProfile.id },
          data: { brandName },
        });
        console.log(`   ✅ Nome da marca atualizado`);
      }
    } else {
      console.log(`\n🔄 Criando perfil de organizador...`);
      const organizerProfile = await prisma.organizerProfile.create({
        data: {
          userId: user.id,
          brandName,
          status: "PENDING", // Will need admin approval
        },
      });
      console.log(`   ✅ Perfil de organizador criado`);
      console.log(`   ID: ${organizerProfile.id}`);
      console.log(`   Status: ${organizerProfile.status} (PENDING - precisa de aprovação)`);
    }

    // Final check
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        organizerProfile: true,
      },
    });

    console.log(`\n✅ Conversão concluída!`);
    console.log(`\n📋 Dados finais:`);
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   Role: ${updatedUser.role}`);
    console.log(`   Perfil de organizador: ${updatedUser.organizerProfile ? "✅ Criado" : "❌ Não criado"}`);
    if (updatedUser.organizerProfile) {
      console.log(`   Marca: ${updatedUser.organizerProfile.brandName}`);
      console.log(`   Status: ${updatedUser.organizerProfile.status}`);
    }

    console.log(`\n⚠️  IMPORTANTE:`);
    console.log(`   - Faça logout completo e login novamente`);
    console.log(`   - O perfil de organizador está como PENDING`);
    console.log(`   - Um administrador precisa aprovar o perfil para você criar eventos`);

  } catch (error) {
    console.error("❌ Erro:", error.message);
    if (error.code) {
      console.error(`   Código: ${error.code}`);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

