// Script para verificar e atualizar role do usuário
const path = require('path');
const fs = require('fs');
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

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAndUpdateUser(email) {
  try {
    console.log(`🔍 Verificando usuário com email: ${email}`);
    
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) {
      console.error(`❌ Usuário com email ${email} não encontrado!`);
      process.exit(1);
    }

    console.log(`\n📋 Usuário encontrado:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Nome: ${user.name || 'N/A'}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role atual: ${user.role}`);

    if (user.role === 'ADMIN') {
      console.log(`\n✅ Usuário já é administrador!`);
      await prisma.$disconnect();
      return;
    }

    console.log(`\n🔄 Atualizando role de ${user.role} para ADMIN...`);
    
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
      select: { id: true, email: true, name: true, role: true },
    });

    console.log(`\n✅ Usuário promovido a administrador com sucesso!`);
    console.log(`📋 Dados atualizados:`);
    console.log(`   ID: ${updatedUser.id}`);
    console.log(`   Nome: ${updatedUser.name || 'N/A'}`);
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   Novo Role: ${updatedUser.role}`);
  } catch (error) {
    console.error('❌ Erro ao verificar/atualizar usuário:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2] || 'vascomelo2007@gmail.com';
checkAndUpdateUser(email);

