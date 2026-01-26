// Script para verificar se a senha está correta
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
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function verifyPassword(email, password) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true, password: true },
    });

    if (!user) {
      console.error(`❌ Usuário não encontrado!`);
      process.exit(1);
    }

    console.log(`\n📋 Usuário encontrado:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Nome: ${user.name || 'N/A'}`);
    console.log(`   Role: ${user.role}`);
    
    const isValid = await bcrypt.compare(password, user.password);
    
    if (isValid) {
      console.log(`\n✅ Senha CORRETA!`);
    } else {
      console.log(`\n❌ Senha INCORRETA!`);
      console.log(`\n💡 Para redefinir a senha, execute:`);
      console.log(`   node apps/web/scripts/recreate-admin-user.js ${email} nova_senha`);
    }
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2] || 'vascomelo2007@gmail.com';
const password = process.argv[3] || 'admin123';

verifyPassword(email, password);

