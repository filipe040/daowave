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
  console.log(`\n🔄 Configurando roles dos usuários...\n`);

  try {
    await prisma.$connect();

    // Set vascomelo2007@gmail.com as ADMIN
    const adminEmail = "vascomelo2007@gmail.com";
    const adminUser = await prisma.user.findUnique({
      where: { email: adminEmail },
      include: { organizerProfile: true },
    });

    if (adminUser) {
      if (adminUser.role !== "ADMIN") {
        console.log(`🔄 Convertendo ${adminEmail} para ADMIN...`);
        await prisma.user.update({
          where: { id: adminUser.id },
          data: { role: "ADMIN" },
        });
        console.log(`   ✅ Role atualizado para ADMIN`);
      } else {
        console.log(`   ✅ ${adminEmail} já é ADMIN`);
      }

      // Remove organizer profile if exists (admins don't need it)
      if (adminUser.organizerProfile) {
        console.log(`🗑️  Removendo perfil de organizador de ${adminEmail}...`);
        await prisma.organizerProfile.delete({
          where: { id: adminUser.organizerProfile.id },
        });
        console.log(`   ✅ Perfil removido`);
      }
    } else {
      console.log(`⚠️  Usuário ${adminEmail} não encontrado`);
    }

    // Set vascomelo2005@gmail.com as ORGANIZER
    const organizerEmail = "vascomelo2005@gmail.com";
    const organizerUser = await prisma.user.findUnique({
      where: { email: organizerEmail },
      include: { organizerProfile: true },
    });

    if (organizerUser) {
      if (organizerUser.role !== "ORGANIZER") {
        console.log(`🔄 Convertendo ${organizerEmail} para ORGANIZER...`);
        await prisma.user.update({
          where: { id: organizerUser.id },
          data: { role: "ORGANIZER" },
        });
        console.log(`   ✅ Role atualizado para ORGANIZER`);
      } else {
        console.log(`   ✅ ${organizerEmail} já é ORGANIZER`);
      }

      // Create organizer profile if doesn't exist
      if (!organizerUser.organizerProfile) {
        console.log(`🔄 Criando perfil de organizador para ${organizerEmail}...`);
        const profile = await prisma.organizerProfile.create({
          data: {
            userId: organizerUser.id,
            brandName: organizerUser.name || "Meu Negócio",
            status: "APPROVED",
          },
        });
        console.log(`   ✅ Perfil criado e aprovado`);
      } else if (organizerUser.organizerProfile.status !== "APPROVED") {
        console.log(`🔄 Aprovando perfil de organizador...`);
        await prisma.organizerProfile.update({
          where: { id: organizerUser.organizerProfile.id },
          data: { status: "APPROVED" },
        });
        console.log(`   ✅ Perfil aprovado`);
      } else {
        console.log(`   ✅ Perfil de organizador já existe e está aprovado`);
      }
    } else {
      console.log(`⚠️  Usuário ${organizerEmail} não encontrado`);
      console.log(`   💡 Crie a conta primeiro através do signup`);
    }

    console.log(`\n✅ Configuração concluída!\n`);

  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

