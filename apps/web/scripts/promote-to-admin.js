// Script para promover um usuário a administrador
// Load .env from root
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

async function promoteToAdmin(email) {
  try {
    console.log(`🔍 Procurando usuário com email: ${email}`);
    
    let user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) {
      console.log(`⚠️  Usuário não encontrado. Criando novo usuário como administrador...`);
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10); // Senha padrão temporária
      
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: 'Administrador',
          role: 'ADMIN',
        },
        select: { id: true, email: true, name: true, role: true },
      });
      
      console.log(`\n✅ Usuário criado como administrador!`);
      console.log(`📋 Dados do novo usuário:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Nome: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`\n⚠️  IMPORTANTE: Senha temporária definida como "admin123"`);
      console.log(`   Por favor, altere a senha após o primeiro login!`);
      await prisma.$disconnect();
      return;
    }

    console.log(`📋 Usuário encontrado:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Nome: ${user.name || 'N/A'}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role atual: ${user.role}`);

    if (user.role === 'ADMIN') {
      console.log(`✅ Usuário já é administrador!`);
      await prisma.$disconnect();
      return;
    }

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
    console.error('❌ Erro ao promover/criar usuário:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2] || 'vascomelo2007@gmail.com';
promoteToAdmin(email);