/**
 * Script para verificar se a RESEND_API_KEY está configurada corretamente
 * Execute: node scripts/check-resend-key.js
 */

require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '../.env' });

const apiKey = process.env.RESEND_API_KEY;

console.log('========================================');
console.log('Verificação da RESEND_API_KEY');
console.log('========================================\n');

if (!apiKey) {
  console.log('❌ RESEND_API_KEY não encontrada no .env');
  console.log('\nCertifique-se de que tem:');
  console.log('RESEND_API_KEY=re_sua_api_key');
  process.exit(1);
}

console.log('✅ RESEND_API_KEY encontrada');
console.log(`   Comprimento: ${apiKey.length} caracteres`);
console.log(`   Começa com "re_": ${apiKey.startsWith('re_') ? '✅ Sim' : '❌ Não'}`);

// Verificar se tem aspas
if (apiKey.startsWith('"') || apiKey.startsWith("'")) {
  console.log('\n⚠️  ATENÇÃO: A API key parece ter aspas!');
  console.log('   Remova as aspas do .env:');
  console.log('   ❌ RESEND_API_KEY="re_..."');
  console.log('   ✅ RESEND_API_KEY=re_...');
}

// Verificar espaços
if (apiKey.includes(' ') || apiKey.trim() !== apiKey) {
  console.log('\n⚠️  ATENÇÃO: A API key tem espaços!');
  console.log('   Remova todos os espaços');
}

// Mostrar primeiros e últimos caracteres (mascarado)
const masked = apiKey.length > 10 
  ? `${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 5)}`
  : '***';
console.log(`   Chave (mascarada): ${masked}\n`);

// Tentar criar cliente Resend para testar
try {
  const { Resend } = require('resend');
  const client = new Resend(apiKey);
  console.log('✅ Cliente Resend criado com sucesso');
  console.log('   A API key parece estar no formato correto\n');
  console.log('💡 Se ainda der erro "API key is invalid":');
  console.log('   1. Verifique se a chave está ativa no Resend Dashboard');
  console.log('   2. Certifique-se de que copiou a chave completa');
  console.log('   3. Reinicie o servidor após atualizar o .env');
} catch (error) {
  console.log('❌ Erro ao criar cliente Resend:', error.message);
  console.log('\n💡 Verifique:');
  console.log('   1. Se a API key está correta');
  console.log('   2. Se o pacote "resend" está instalado: npm install resend');
}
