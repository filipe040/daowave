/**
 * Script para mostrar exatamente o que está no .env
 * Execute: node scripts/show-env-key.js
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = resolve(__dirname, '../.env');

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║   Verificação Direta do Ficheiro .env                      ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

console.log(`📁 Ficheiro: ${envPath}\n`);

try {
  const content = readFileSync(envPath, 'utf8');
  
  // Encontrar todas as linhas com RESEND_API_KEY
  const lines = content.split('\n');
  const resendLines = lines
    .map((line, index) => ({ line: line.trim(), lineNumber: index + 1 }))
    .filter(({ line }) => line.includes('RESEND_API_KEY'));
  
  if (resendLines.length === 0) {
    console.log('❌ Nenhuma linha com RESEND_API_KEY encontrada no .env');
  } else {
    console.log(`✅ Encontradas ${resendLines.length} linha(s) com RESEND_API_KEY:\n`);
    
    resendLines.forEach(({ line, lineNumber }) => {
      console.log(`📄 Linha ${lineNumber}:`);
      console.log(`   ${line}\n`);
      
      // Extrair o valor
      const match = line.match(/RESEND_API_KEY\s*=\s*(.+)/);
      if (match) {
        let value = match[1].trim();
        
        // Remover aspas se existirem
        const originalValue = value;
        value = value.replace(/^["']|["']$/g, '');
        
        console.log(`   🔑 Valor extraído:`);
        console.log(`      ${value}`);
        console.log(`   📏 Comprimento: ${value.length} caracteres`);
        
        if (originalValue !== value) {
          console.log(`   ⚠️  Tinha aspas que foram removidas`);
        }
        
        if (value.length < 45) {
          console.log(`   ⚠️  ATENÇÃO: Chave parece incompleta! (esperado ~50 caracteres)`);
        } else if (value.length > 60) {
          console.log(`   ⚠️  ATENÇÃO: Chave parece muito longa!`);
        } else {
          console.log(`   ✅ Comprimento parece correto`);
        }
        
        console.log(`   🔍 Primeiros 15 caracteres: ${value.substring(0, 15)}...`);
        console.log(`   🔍 Últimos 10 caracteres: ...${value.substring(Math.max(0, value.length - 10))}`);
        console.log('');
      }
    });
  }
  
  // Mostrar também o que o process.env vê (após dotenv)
  console.log('─'.repeat(60));
  console.log('📦 Valor em process.env (após dotenv):\n');
  
  // Não carregar dotenv aqui para não interferir, mas mostrar o que seria
  const dotenv = await import('dotenv');
  dotenv.config({ path: envPath });
  
  const envKey = process.env.RESEND_API_KEY;
  if (envKey) {
    console.log(`   🔑 RESEND_API_KEY: ${envKey.substring(0, 15)}...${envKey.substring(Math.max(0, envKey.length - 10))}`);
    console.log(`   📏 Comprimento: ${envKey.length} caracteres`);
  } else {
    console.log(`   ❌ RESEND_API_KEY não encontrada em process.env`);
  }
  
} catch (error) {
  console.log(`❌ Erro ao ler ficheiro: ${error.message}`);
  console.log(`   Verifique se o ficheiro existe em: ${envPath}`);
}

console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║   Verificação concluída                                    ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');
