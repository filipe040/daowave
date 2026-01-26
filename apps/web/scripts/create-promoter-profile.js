/**
 * Script para criar PromoterProfile para um utilizador
 * Uso: node scripts/create-promoter-profile.js <email>
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || 'vascomelo2005@gmail.com';
  
  console.log(`\n🔍 Procurando utilizador: ${email}\n`);

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        promoterProfile: true,
      },
    });

    if (!user) {
      console.error(`❌ Utilizador não encontrado: ${email}`);
      process.exit(1);
    }

    console.log(`✅ Utilizador encontrado:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Nome: ${user.name || 'N/A'}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);

    // Check if already has profile
    if (user.promoterProfile) {
      console.log(`\n✅ Utilizador já tem PromoterProfile:`);
      console.log(`   ID: ${user.promoterProfile.id}`);
      console.log(`   Company Name: ${user.promoterProfile.companyName}`);
      console.log(`   Created At: ${user.promoterProfile.createdAt}`);
      return;
    }

    // Check if user is PROMOTER
    if (user.role !== 'PROMOTER' && user.role !== 'ADMIN') {
      console.log(`\n⚠️  Utilizador não é PROMOTER (role: ${user.role})`);
      console.log(`   A atualizar role para PROMOTER...`);
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'PROMOTER' },
      });
      console.log(`   ✅ Role atualizado para PROMOTER`);
    }

    // Create PromoterProfile
    console.log(`\n🔄 Criando PromoterProfile...`);
    const companyName = user.name || email.split('@')[0] || 'Promoter';
    
    const promoterProfile = await prisma.promoterProfile.create({
      data: {
        userId: user.id,
        companyName: companyName,
        contactEmail: user.email,
      },
    });

    console.log(`✅ PromoterProfile criado com sucesso!`);
    console.log(`   ID: ${promoterProfile.id}`);
    console.log(`   Company Name: ${promoterProfile.companyName}`);
    console.log(`   Contact Email: ${promoterProfile.contactEmail}`);
    console.log(`\n✅ Utilizador ${email} agora tem acesso ao dashboard de promotor!\n`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.code === 'P2002') {
      console.error('   Já existe um PromoterProfile para este utilizador.');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
