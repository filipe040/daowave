/**
 * Script completo de verificação da configuração do Resend
 * Execute: node scripts/verify-resend-setup.js
 */

async function verifyResendSetup() {
  const dotenv = await import('dotenv');
  const fs = await import('fs');
  const path = await import('path');
  
  // Tentar carregar de múltiplos locais
  const envPaths = [
    path.resolve('.env'),
    path.resolve('../.env'),
    path.resolve('../../.env'),
  ];

  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   Verificação Completa da Configuração Resend            ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  // 1. Verificar se .env existe
  let envPath = null;
  let envExists = false;
  
  for (const envPathToCheck of envPaths) {
    if (fs.existsSync(envPathToCheck)) {
      envPath = envPathToCheck;
      envExists = true;
      dotenv.config({ path: envPathToCheck });
      break;
    }
  }
  
  console.log('1️⃣  Verificando ficheiro .env...');
  if (envExists) {
    console.log('   ✅ Ficheiro .env encontrado:', envPath);
    
    // Ler diretamente do ficheiro para mostrar o valor exato
    try {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const resendLine = envContent.split('\n').find(line => line.trim().startsWith('RESEND_API_KEY='));
      if (resendLine) {
        const keyValue = resendLine.split('=')[1]?.trim().replace(/^["']|["']$/g, '') || '';
        console.log(`   📄 Linha no .env: ${resendLine.substring(0, 30)}...`);
        console.log(`   🔑 Valor extraído: ${keyValue.substring(0, 15)}...${keyValue.substring(Math.max(0, keyValue.length - 10))}`);
        console.log(`   📏 Comprimento no ficheiro: ${keyValue.length} caracteres`);
      }
    } catch (err) {
      console.log('   ⚠️  Não foi possível ler o ficheiro diretamente');
    }
  } else {
    console.log('   ❌ Ficheiro .env NÃO encontrado em nenhum destes locais:');
    envPaths.forEach(p => console.log(`      - ${p}`));
    console.log('   💡 Crie um ficheiro .env na raiz do projeto (apps/web/.env)');
    return;
  }

  // 2. Verificar RESEND_API_KEY
  console.log('\n2️⃣  Verificando RESEND_API_KEY...');
  const apiKey = process.env.RESEND_API_KEY?.trim().replace(/^["']|["']$/g, '');
  
  if (!apiKey) {
    console.log('   ❌ RESEND_API_KEY não encontrada no .env');
    console.log('   💡 Adicione: RESEND_API_KEY=re_sua_chave_aqui');
    return;
  }

  console.log('   ✅ RESEND_API_KEY encontrada');
  console.log(`   📏 Comprimento: ${apiKey.length} caracteres`);
  console.log(`   🔑 Prefixo: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}`);

  // Verificar comprimento
  if (apiKey.length < 45) {
    console.log('\n   ⚠️  ATENÇÃO: A API key parece estar INCOMPLETA!');
    console.log('   📊 Comprimento esperado: ~50 caracteres');
    console.log('   📊 Comprimento atual: ' + apiKey.length + ' caracteres');
    console.log('   💡 As API keys do Resend normalmente têm ~50 caracteres');
    console.log('   💡 Verifique se copiou a chave completa do Resend Dashboard');
    console.log('   💡 A chave só é mostrada UMA VEZ quando criada');
  } else if (apiKey.length > 60) {
    console.log('\n   ⚠️  ATENÇÃO: A API key parece estar muito longa!');
    console.log('   💡 Verifique se não copiou espaços ou caracteres extras');
  } else {
    console.log('   ✅ Comprimento parece correto (~50 caracteres)');
  }

  // Verificar formato
  if (!apiKey.startsWith('re_')) {
    console.log('\n   ❌ A API key não começa com "re_"');
    console.log('   💡 As API keys do Resend começam sempre com "re_"');
  } else {
    console.log('   ✅ Formato correto (começa com "re_")');
  }

  // 3. Verificar outras variáveis
  console.log('\n3️⃣  Verificando outras variáveis...');
  
  const emailFrom = process.env.EMAIL_FROM;
  if (emailFrom) {
    console.log(`   ✅ EMAIL_FROM: ${emailFrom}`);
  } else {
    console.log('   ⚠️  EMAIL_FROM não definido (usando padrão)');
  }

  const appUrl = process.env.APP_URL;
  if (appUrl) {
    console.log(`   ✅ APP_URL: ${appUrl}`);
  } else {
    console.log('   ⚠️  APP_URL não definido (usando padrão)');
  }

  const emailsEnabled = process.env.EMAILS_ENABLED;
  console.log(`   📧 EMAILS_ENABLED: ${emailsEnabled || 'true (padrão)'}`);

  // 4. Testar API key diretamente
  console.log('\n4️⃣  Testando API key com Resend...');
  
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);
    
    console.log('   📧 A enviar email de teste...');
    
    const result = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'delivered@resend.dev',
      subject: 'Teste de API Key',
      html: '<p>Este é um teste automático da configuração.</p>',
    });

    if (result.error) {
      console.log('\n   ❌ ERRO ao enviar email:');
      console.log(`      Código: ${result.error.name || 'Unknown'}`);
      console.log(`      Mensagem: ${result.error.message}`);
      
      if (result.error.message?.includes('invalid') || result.error.message?.includes('API key')) {
        console.log('\n   🔍 DIAGNÓSTICO:');
        console.log('      A API key está sendo rejeitada pelo Resend.');
        console.log('      Possíveis causas:');
        console.log('      1. A chave está incompleta (menos de 45 caracteres)');
        console.log('      2. A chave foi revogada no Resend Dashboard');
        console.log('      3. A chave pertence a outro workspace/projeto');
        console.log('      4. A chave expirou');
        console.log('\n   💡 SOLUÇÃO:');
        console.log('      1. Aceda a https://resend.com/api-keys');
        console.log('      2. Verifique se a chave está ATIVA');
        console.log('      3. Se necessário, crie uma NOVA chave');
        console.log('      4. Copie a chave COMPLETA (~50 caracteres)');
        console.log('      5. Atualize o .env e reinicie o servidor');
      }
    } else {
      console.log('\n   ✅ SUCESSO! Email enviado com sucesso!');
      console.log(`      Message ID: ${result.data?.id}`);
      console.log('\n   🎉 A sua configuração está CORRETA!');
      console.log('   ✅ A API key é válida e funcional');
    }
  } catch (error) {
    console.log('\n   ❌ Erro ao testar API key:');
    console.log(`      ${error.message}`);
  }

  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║   Verificação concluída                                    ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
}

verifyResendSetup().catch(console.error);
