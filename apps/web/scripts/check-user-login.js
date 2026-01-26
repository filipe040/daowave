const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
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
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log("\n📋 Uso: node check-user-login.js <email> [password]");
    console.log("   Exemplo: node check-user-login.js user@example.com minhaSenha123");
    console.log("   Se não fornecer a senha, apenas verifica se o usuário existe\n");
    process.exit(1);
  }

  const email = args[0];
  const password = args[1];
  const normalizedEmail = email.toLowerCase().trim();

  console.log(`\n🔍 Verificando usuário...`);
  console.log(`   Email fornecido: "${email}"`);
  console.log(`   Email normalizado: "${normalizedEmail}"`);
  console.log("");

  try {
    await prisma.$connect();
    console.log(`✅ Conectado ao banco de dados`);

    // Check if user exists with normalized email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      console.error(`❌ Usuário não encontrado com email: "${normalizedEmail}"`);
      
      // Try to find similar emails
      console.log(`\n🔍 Procurando emails similares...`);
      const allUsers = await prisma.user.findMany({
        select: { email: true, name: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      if (allUsers.length > 0) {
        console.log(`\n📋 Últimos ${allUsers.length} usuários criados:`);
        allUsers.forEach((u, i) => {
          const similarity = u.email.toLowerCase().includes(normalizedEmail) || normalizedEmail.includes(u.email.toLowerCase());
          const marker = similarity ? " ⚠️  (similar)" : "";
          console.log(`   ${i + 1}. ${u.email}${marker}`);
          console.log(`      Nome: ${u.name || "N/A"}`);
          console.log(`      Criado: ${u.createdAt.toLocaleString("pt-PT")}`);
        });
      }

      // Check if email exists with different case
      const allEmails = await prisma.user.findMany({
        select: { email: true },
      });
      
      const foundSimilar = allEmails.find(u => 
        u.email.toLowerCase() === normalizedEmail || 
        u.email.toLowerCase().includes(normalizedEmail) ||
        normalizedEmail.includes(u.email.toLowerCase())
      );

      if (foundSimilar) {
        console.log(`\n⚠️  Encontrado email similar: "${foundSimilar.email}"`);
        console.log(`   Tente fazer login com: "${foundSimilar.email}"`);
      }

      process.exit(1);
    }

    console.log(`✅ Usuário encontrado!`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Nome: ${user.name || "N/A"}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Criado em: ${user.createdAt.toLocaleString("pt-PT")}`);

    if (password) {
      console.log(`\n🔐 Verificando senha...`);
      const isValid = await bcrypt.compare(password, user.password);

      if (isValid) {
        console.log(`✅ Senha CORRETA!`);
        console.log(`\n✅ Login deve funcionar com:`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Senha: ${password}`);
      } else {
        console.error(`❌ Senha INCORRETA!`);
        console.log(`\n⚠️  O usuário existe, mas a senha fornecida está incorreta.`);
        console.log(`   Verifique se digitou a senha corretamente.`);
      }
    } else {
      console.log(`\n💡 Para verificar a senha, execute:`);
      console.log(`   node check-user-login.js "${user.email}" "suaSenha"`);
    }

  } catch (error) {
    console.error("❌ Erro:", error.message);
    if (error.code === 'P1001') {
      console.error("\n💡 Erro de conexão com o banco de dados!");
      console.error("   Verifique se o Docker está rodando: docker ps");
      console.error("   Inicie os containers: npm run docker:up");
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

