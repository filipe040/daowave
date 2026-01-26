// Script para eliminar conta existente e criar nova como administrador
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

async function recreateAdminUser(email, password) {
  try {
    console.log(`🔍 Verificando usuário com email: ${email}`);
    
    // Verificar se usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true },
    });

    if (existingUser) {
      console.log(`\n📋 Usuário encontrado:`);
      console.log(`   ID: ${existingUser.id}`);
      console.log(`   Nome: ${existingUser.name || 'N/A'}`);
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Role: ${existingUser.role}`);
      
      // Verificar se tem relacionamentos que precisam ser tratados
      const hasOrders = await prisma.order.count({ where: { userId: existingUser.id } });
      const hasOrganizerProfile = await prisma.promoterProfile.findUnique({ where: { userId: existingUser.id } });
      
      if (hasOrders > 0) {
        console.log(`\n⚠️  ATENÇÃO: Este usuário tem ${hasOrders} pedido(s) associado(s).`);
        console.log(`   Os pedidos serão mantidos, mas o userId será removido.`);
      }
      
      if (hasOrganizerProfile) {
        console.log(`\n⚠️  ATENÇÃO: Este usuário tem um perfil de promotor associado.`);
        console.log(`   O perfil de promotor será removido.`);
        
        // Remover perfil de promotor primeiro
        await prisma.promoterProfile.delete({
          where: { userId: existingUser.id }
        });
        console.log(`   ✅ Perfil de promotor removido`);
      }
      
      console.log(`\n🗑️  Removendo usuário existente...`);
      
      // Remover usuário (cascata vai remover relacionamentos)
      await prisma.user.delete({
        where: { email }
      });
      
      console.log(`   ✅ Usuário removido com sucesso`);
    } else {
      console.log(`   ℹ️  Nenhum usuário encontrado com este email`);
    }

    console.log(`\n🆕 Criando novo usuário como administrador...`);
    
    // Criar novo usuário como ADMIN
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: 'Administrador',
        role: 'ADMIN',
      },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    console.log(`\n✅ Novo usuário administrador criado com sucesso!`);
    console.log(`📋 Dados do novo usuário:`);
    console.log(`   ID: ${newUser.id}`);
    console.log(`   Nome: ${newUser.name}`);
    console.log(`   Email: ${newUser.email}`);
    console.log(`   Role: ${newUser.role}`);
    console.log(`   Criado em: ${newUser.createdAt.toLocaleString('pt-PT')}`);
    
    console.log(`\n🔐 Credenciais de acesso:`);
    console.log(`   Email: ${email}`);
    console.log(`   Senha: ${password}`);
    console.log(`\n⚠️  IMPORTANTE: Guarde estas credenciais em segurança!`);
    
  } catch (error) {
    console.error('❌ Erro ao recriar usuário:', error);
    if (error.code === 'P2003') {
      console.error('   Erro: Existem relacionamentos que impedem a remoção.');
      console.error('   Tente remover manualmente os relacionamentos primeiro.');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2] || 'vascomelo2007@gmail.com';
const password = process.argv[3] || 'admin123';

console.log(`\n🔄 Recriando usuário administrador...`);
console.log(`   Email: ${email}`);
console.log(`   Senha: ${password}`);
console.log(`\n`);

recreateAdminUser(email, password);

