/**
 * Teste direto da API do Resend
 * Execute: node scripts/test-resend.js
 */

async function testResend() {
  const dotenv = await import('dotenv');
  dotenv.config({ path: '.env' });
  dotenv.config({ path: '../.env' });

  const { Resend } = await import('resend');

  const apiKey = process.env.RESEND_API_KEY?.trim().replace(/^["']|["']$/g, '');

  console.log('========================================');
  console.log('Teste Direto da API Resend');
  console.log('========================================\n');

  if (!apiKey) {
    console.log('❌ RESEND_API_KEY não encontrada');
    process.exit(1);
  }

  console.log(`API Key encontrada: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}`);
  console.log(`Comprimento: ${apiKey.length} caracteres\n`);

  try {
    const resend = new Resend(apiKey);
    
    console.log('📧 A testar envio de email...\n');
    
    // Testar envio de email
    const result = await resend.emails.send({
      from: 'onboarding@resend.dev', // Email de teste do Resend
      to: 'delivered@resend.dev', // Email de teste do Resend
      subject: 'Teste de API Key',
      html: '<p>Este é um teste da API key do Resend.</p>',
    });

    if (result.error) {
      console.log('❌ Erro ao enviar email:');
      console.log(`   Código: ${result.error.name || 'Unknown'}`);
      console.log(`   Mensagem: ${result.error.message}`);
      
      if (result.error.message?.includes('invalid') || result.error.message?.includes('API key')) {
        console.log('\n💡 A API key está inválida. Verifique:');
        console.log('   1. Se a chave está ativa no Resend Dashboard');
        console.log('   2. Se copiou a chave completa (sem cortes)');
        console.log('   3. Se a chave não expirou ou foi revogada');
        console.log('   4. Se está a usar a chave correta do projeto');
      }
    } else {
      console.log('✅ Email enviado com sucesso!');
      console.log(`   Message ID: ${result.data?.id}`);
      console.log('\n✅ A API key está válida e funcional!');
    }
  } catch (error) {
    console.log('❌ Erro ao criar cliente Resend:');
    console.log(`   ${error.message}`);
    
    if (error.message?.includes('invalid') || error.message?.includes('API')) {
      console.log('\n💡 A API key parece estar inválida.');
      console.log('   Verifique no Resend Dashboard se a chave está ativa.');
    }
  }
}

testResend().catch(console.error);
