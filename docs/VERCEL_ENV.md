# Variáveis de Ambiente no Vercel

Este documento lista todas as variáveis de ambiente necessárias para deploy no Vercel.

## ⚠️ IMPORTANTE

- **NEXTAUTH_URL**: Deve ser a URL pública da aplicação (ex: `https://daowave-beta.vercel.app`). **NÃO usar `localhost` em produção**.
- **APP_URL**: Deve ser a URL pública da aplicação. Usado para links em emails e redirects.
- Todas as variáveis devem ser configuradas no dashboard do Vercel em **Settings → Environment Variables**.
- Configure para **Production**, **Preview** e **Development** conforme necessário.

## 🔴 Obrigatórias (Production + Preview)

### Autenticação
```env
NEXTAUTH_SECRET=<min-32-chars-secret>
# Exemplo: openssl rand -base64 32
# ⚠️ Deve ter pelo menos 32 caracteres
# ⚠️ NÃO usar o mesmo secret em diferentes ambientes

NEXTAUTH_URL=https://daowave-beta.vercel.app
# ⚠️ NÃO usar localhost em produção!
# ⚠️ Deve ser a URL pública completa (com https://)
```

### Base de Dados
```env
DATABASE_URL=<supabase-connection-pooler-url>
# URL do connection pooler do Supabase
# Formato: postgresql://user:password@host:port/database?pgbouncer=true

DIRECT_URL=<supabase-direct-url>
# URL direta do Supabase (para migrations)
# Formato: postgresql://user:password@host:port/database
# ⚠️ Usado apenas para migrations, não para queries normais
```

### Segurança QR
```env
QR_SECRET=<min-32-chars-secret>
# Secret para assinatura de QR codes
# Exemplo: openssl rand -base64 32
# ⚠️ Deve ter pelo menos 32 caracteres
```

### Email (Resend)
```env
RESEND_API_KEY=<resend-api-key>
# API key do Resend (formato: re_...)
# Obter em: https://resend.com/api-keys

EMAIL_FROM=noreply@daowave.pt
# Email de origem (com ou sem display name)
# Exemplo: " <noreply@daowave.pt>" ou "noreply@daowave.pt"

APP_URL=https://daowave-beta.vercel.app
# URL base da aplicação (usado para links em emails)
# ⚠️ NÃO usar localhost em produção!
```

## 🟡 Opcionais (mas recomendadas)

### Pagamentos (Stripe)
```env
STRIPE_SECRET_KEY=<stripe-secret-key>
# Secret key do Stripe (formato: sk_...)
# Obter em: https://dashboard.stripe.com/apikeys

STRIPE_PUBLISHABLE_KEY=<stripe-publishable-key>
# Publishable key do Stripe (formato: pk_...)
# Obter em: https://dashboard.stripe.com/apikeys

STRIPE_WEBHOOK_SECRET=<stripe-webhook-secret>
# Secret do webhook do Stripe
# Obter em: https://dashboard.stripe.com/webhooks
```

### Observabilidade (Sentry)
```env
SENTRY_DSN=<sentry-dsn>
# DSN do Sentry para error tracking
# Formato: https://...@...sentry.io/...
# Obter em: https://sentry.io/settings/projects/

SENTRY_ENV=production
# Ambiente do Sentry (development, staging, production)
```

### CORS
```env
CORS_ORIGINS=https://daowave-beta.vercel.app,https://daowave.pt
# Lista separada por vírgulas de origens permitidas para CORS
# Usado no middleware para permitir requisições cross-origin
# ⚠️ Opcional - se não configurado, CORS não é aplicado no middleware
```

### Storage (S3 Compatible)
```env
STORAGE_ENDPOINT=<s3-endpoint-url>
# Endpoint do S3 (ex: https://s3.amazonaws.com)

STORAGE_ACCESS_KEY=<s3-access-key>
# Access key do S3

STORAGE_SECRET_KEY=<s3-secret-key>
# Secret key do S3

STORAGE_BUCKET=<s3-bucket-name>
# Nome do bucket S3
```

## 🟢 Opcionais (Desenvolvimento)

### Feature Flags
```env
ENABLE_MOCK_PAYMENTS=true
# Habilitar pagamentos mock (para desenvolvimento)

ENABLE_REAL_PAYMENTS=false
# Habilitar pagamentos reais (apenas em produção)

ENABLE_REAL_EMAILS=false
# Habilitar envio real de emails (apenas em produção)

SHOW_BETA_BANNER=true
# Mostrar banner de beta

BETA_CLOSED_REGISTRATION=false
# Fechar registo (apenas emails na allowlist)
```

### Email Controls
```env
EMAILS_ENABLED=true
# Habilitar envio de emails

EMAILS_MODE=public_beta
# Modo de emails: public_beta ou production
```

## 📋 Checklist de Configuração no Vercel

### 1. Aceder ao Dashboard
- Ir para https://vercel.com/dashboard
- Selecionar o projeto

### 2. Configurar Environment Variables
- Ir para **Settings → Environment Variables**
- Adicionar cada variável obrigatória
- Selecionar ambientes: **Production**, **Preview**, **Development**

### 3. Verificar NEXTAUTH_URL
- ✅ Deve ser a URL pública (ex: `https://daowave-beta.vercel.app`)
- ❌ NÃO deve ser `http://localhost:3000`
- ✅ Deve começar com `https://`

### 4. Verificar APP_URL
- ✅ Deve ser a URL pública (ex: `https://daowave-beta.vercel.app`)
- ❌ NÃO deve ser `http://localhost:3000`
- ✅ Deve começar com `https://`

### 5. Verificar Secrets
- ✅ `NEXTAUTH_SECRET` tem pelo menos 32 caracteres
- ✅ `QR_SECRET` tem pelo menos 32 caracteres
- ✅ Secrets são diferentes em cada ambiente

### 6. Fazer Deploy
- Fazer push para o repositório
- Ou fazer deploy manual no dashboard
- Verificar logs em **Runtime Logs → Edge** para erros do middleware

## 🔍 Troubleshooting

### Erro: "MIDDLEWARE_INVOCATION_FAILED"
- Verificar se `NEXTAUTH_SECRET` está configurado
- Verificar se `NEXTAUTH_URL` não é `localhost`
- Verificar logs em **Runtime Logs → Edge** no Vercel
- Procurar por `[middleware]` nos logs

### Erro: "NEXTAUTH_SECRET not configured"
- Adicionar `NEXTAUTH_SECRET` nas Environment Variables
- Garantir que tem pelo menos 32 caracteres
- Fazer redeploy após adicionar

### Erro: "Redirect loop"
- Verificar se `NEXTAUTH_URL` está correto
- Verificar se `/auth/signin` existe e está acessível
- Verificar se não há redirects infinitos no middleware

### Rotas protegidas não funcionam
- Verificar se `NEXTAUTH_SECRET` está configurado
- Verificar se o token JWT está válido
- Verificar logs do middleware em **Runtime Logs → Edge**

## 📝 Notas

- O middleware usa `process.env.NEXTAUTH_SECRET` diretamente (Edge-safe)
- Se `NEXTAUTH_SECRET` não estiver configurado, o middleware permite acesso (proteção feita nos route handlers)
- O middleware não falha se `CORS_ORIGINS` não estiver configurado (CORS é opcional)
- Todos os erros do middleware são logados com prefixo `[middleware]` para facilitar debugging
