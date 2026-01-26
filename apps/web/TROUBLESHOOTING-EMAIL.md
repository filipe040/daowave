# Troubleshooting: Emails não são enviados

## Verificações Rápidas

### 1. Verificar variáveis de ambiente

Certifique-se de que tem estas variáveis no `.env`:

```env
# Resend API Key (obrigatório)
RESEND_API_KEY="re_sua_api_key_aqui"

# Email From (obrigatório)
EMAIL_FROM="noreply@seu-dominio.com"

# App URL (obrigatório)
APP_URL="http://localhost:3000"

# Emails habilitados (opcional, default: true)
EMAILS_ENABLED="true"
```

### 2. Verificar se Resend está configurado

1. Aceda ao [Resend Dashboard](https://resend.com/)
2. Verifique se tem uma API Key válida
3. Verifique se o domínio está verificado (Settings → Domains)

### 3. Verificar logs do servidor

Quando criar uma conta, verifique os logs do terminal. Deve ver:

```
✓ Verification email sent successfully to email@example.com
```

Se vir erros, copie a mensagem de erro.

## Problemas Comuns

### Erro: "RESEND_API_KEY is not configured"

**Solução:**
1. Obtenha a API Key do Resend
2. Adicione ao `.env`: `RESEND_API_KEY="re_..."`

### Erro: "API key is invalid"

**Solução:**
1. A API Key do Resend está inválida ou expirada
2. Obtenha uma nova API Key:
   - Aceda ao [Resend Dashboard](https://resend.com/api-keys)
   - Vá a "API Keys" → "Create API Key"
   - Copie a nova chave (começa com `re_`)
3. Atualize o `.env`:
   ```env
   RESEND_API_KEY=re_sua_nova_api_key_aqui
   ```
   **Importante:** Não use aspas na API key:
   ```env
   # ✅ Correto
   RESEND_API_KEY=re_abc123...
   
   # ❌ Errado (com aspas)
   RESEND_API_KEY="re_abc123..."
   ```
4. Certifique-se de que não há espaços ou quebras de linha
5. Reinicie o servidor de desenvolvimento

### Erro: "Emails are disabled"

**Solução:**
1. Adicione ao `.env`: `EMAILS_ENABLED="true"`
2. Reinicie o servidor

### Erro: "EmailLog table not found"

**Solução:**
1. Execute o script para criar a tabela:
   ```powershell
   cd apps\web\prisma
   Get-Content create-email-log.sql | & "C:\Program Files\MariaDB 12.1\bin\mysql.exe" -u root ticketing
   ```
2. Gere o Prisma Client:
   ```powershell
   cd ..
   npx prisma generate
   ```

### Email não chega (mas não há erros)

**Possíveis causas:**
1. **Spam/Junk**: Verifique a pasta de spam
2. **Domínio não verificado**: No Resend, verifique se o domínio está verificado
3. **Email inválido**: Verifique se o email está correto
4. **Rate limiting**: Aguarde alguns minutos e tente novamente

### Testar envio de email

Pode testar diretamente no Resend Dashboard:
1. Vá a "Emails" → "Send Email"
2. Envie um email de teste
3. Se funcionar, o problema está no código
4. Se não funcionar, o problema está na configuração do Resend

## Debug Avançado

### Verificar se o email está a ser enviado

Adicione este código temporariamente em `app/api/auth/signup/route.ts`:

```typescript
console.log("=== EMAIL DEBUG ===");
console.log("Config:", {
  enabled: emailConfig.enabled,
  hasApiKey: !!emailConfig.resendApiKey,
  from: emailConfig.from,
  appUrl: emailConfig.appUrl,
});
console.log("Email result:", emailResult);
```

### Verificar logs do Resend

1. Aceda ao Resend Dashboard
2. Vá a "Emails" → "Logs"
3. Veja se há tentativas de envio
4. Se houver, veja o erro específico

## Solução Rápida (Desenvolvimento)

Se apenas quer testar sem configurar Resend:

1. Adicione ao `.env`: `EMAILS_ENABLED="false"`
2. Os emails não serão enviados, mas a conta será criada
3. Pode verificar o email manualmente na base de dados

## Contactar Suporte

Se nada funcionar:
1. Copie todos os logs do terminal
2. Verifique o Resend Dashboard para erros
3. Verifique se o `.env` está correto
4. Partilhe os detalhes para análise
