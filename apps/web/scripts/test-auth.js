// Script para testar autenticação diretamente
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
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function testAuth(email, password) {
  try {
    console.log(`\n🔍 Testando autenticação...`);
    console.log(`   Email: ${email}`);
    
    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    console.log(`   Email normalizado: ${normalizedEmail}`);
    
    // Connect to database
    await prisma.$connect();
    console.log(`✅ Conectado ao banco de dados`);
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      console.error(`❌ Usuário não encontrado!`);
      console.log(`\n💡 Verificando todos os usuários no banco...`);
      const allUsers = await prisma.user.findMany({
        select: { email: true, name: true, role: true }
      });
      console.log(`   Total de usuários: ${allUsers.length}`);
      allUsers.forEach(u => {
        console.log(`   - ${u.email} (${u.name}, ${u.role})`);
      });
      process.exit(1);
    }

    console.log(`✅ Usuário encontrado:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Nome: ${user.name || 'N/A'}`);
    console.log(`   Role: ${user.role}`);
    
    // Compare password
    console.log(`\n🔐 Verificando senha...`);
    const isValid = await bcrypt.compare(password, user.password);
    
    if (isValid) {
      console.log(`✅ Senha CORRETA!`);
      console.log(`\n✅ Autenticação bem-sucedida!`);
      console.log(`\n📋 Dados do usuário autenticado:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Nome: ${user.name || 'N/A'}`);
      console.log(`   Role: ${user.role}`);
    } else {
      console.log(`❌ Senha INCORRETA!`);
      console.log(`\n💡 Para redefinir a senha, execute:`);
      console.log(`   node apps/web/scripts/recreate-admin-user.js ${email} nova_senha`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Erro:', error);
    console.error('   Mensagem:', error.message);
    if (error.code) {
      console.error('   Código:', error.code);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2] || 'vascomelo2007@gmail.com';
const password = process.argv[3] || 'admin123';

testAuth(email, password);

