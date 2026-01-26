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
  const searchEmail = process.argv[2] || "vascomelo2005@gmail.com";
  const normalizedSearch = searchEmail.toLowerCase().trim();

  console.log(`\n🔍 Procurando usuário: ${normalizedSearch}\n`);

  try {
    await prisma.$connect();

    // Try exact match first
    let user = await prisma.user.findUnique({
      where: { email: normalizedSearch },
      include: { organizerProfile: true },
    });

    // If not found, search for similar emails
    if (!user) {
      console.log(`⚠️  Email exato não encontrado. Procurando emails similares...\n`);
      
      const allUsers = await prisma.user.findMany({
        select: { email: true, name: true, role: true },
      });

      // Find similar emails (contains "vascomelo2005" or "2005")
      const similar = allUsers.filter(u => 
        u.email.toLowerCase().includes("vascomelo2005") ||
        u.email.toLowerCase().includes("2005") ||
        u.email.toLowerCase().includes("vascomelo")
      );

      if (similar.length > 0) {
        console.log(`📋 Emails similares encontrados:`);
        similar.forEach((u, i) => {
          console.log(`   ${i + 1}. ${u.email} (${u.name || "N/A"}) - Role: ${u.role}`);
        });
        console.log(`\n💡 Se algum destes é o correto, execute:`);
        console.log(`   node find-and-promote-user.js "${similar[0].email}"`);
        process.exit(0);
      } else {
        console.log(`❌ Nenhum email similar encontrado`);
        console.log(`\n📋 Todos os usuários no banco:`);
        allUsers.forEach((u, i) => {
          console.log(`   ${i + 1}. ${u.email}`);
        });
        process.exit(1);
      }
    }

    console.log(`✅ Usuário encontrado!`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Nome: ${user.name || "N/A"}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role atual: ${user.role}`);
    console.log(`   Perfil de organizador: ${user.organizerProfile ? "✅ Existe" : "❌ Não existe"}`);
    if (user.organizerProfile) {
      console.log(`   Marca: ${user.organizerProfile.brandName}`);
      console.log(`   Status: ${user.organizerProfile.status}`);
    }

    // Promote to ORGANIZER
    if (user.role !== "ORGANIZER") {
      console.log(`\n🔄 Convertendo para ORGANIZER...`);
      await prisma.user.update({
        where: { id: user.id },
        data: { role: "ORGANIZER" },
      });
      console.log(`   ✅ Role atualizado para ORGANIZER`);
    } else {
      console.log(`   ✅ Usuário já é ORGANIZER`);
    }

    // Create or update organizer profile
    const brandName = user.name || "Meu Negócio";
    if (!user.organizerProfile) {
      console.log(`\n🔄 Criando perfil de organizador...`);
      await prisma.organizerProfile.create({
        data: {
          userId: user.id,
          brandName,
          status: "APPROVED",
        },
      });
      console.log(`   ✅ Perfil criado e aprovado`);
    } else {
      if (user.organizerProfile.status !== "APPROVED") {
        console.log(`\n🔄 Aprovando perfil de organizador...`);
        await prisma.organizerProfile.update({
          where: { id: user.organizerProfile.id },
          data: { status: "APPROVED" },
        });
        console.log(`   ✅ Perfil aprovado`);
      } else {
        console.log(`   ✅ Perfil já está aprovado`);
      }
    }

    console.log(`\n✅ Usuário ${user.email} configurado como promotor!\n`);

  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

