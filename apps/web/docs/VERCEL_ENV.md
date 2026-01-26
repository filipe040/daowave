# Environment Variables Required on Vercel

## ⚠️ IMPORTANTE

Este documento lista todas as variáveis de ambiente necessárias para deploy estável no Vercel.

**NUNCA** use `localhost` em produção. Use sempre a URL pública do deploy.

## 🔐 Variáveis Obrigatórias (Production + Preview)

### Autenticação

```env
NEXTAUTH_SECRET=<min-32-chars-secret>
```
- **Descrição**: Secret para assinatura de tokens JWT do NextAuth
- **Mínimo**: 32 caracteres
- **Como gerar**: `openssl rand -base64 32` ou usar gerador online seguro
- **⚠️ CRÍTICO**: Sem esta variável, o middleware não protege rotas `/admin`, `/organizer`, `/validator`

```env
NEXTAUTH_URL=https://daowave-beta.vercel.app
```
- **Descrição**: URL pública da aplicação (usada pelo NextAuth para callbacks)
- **⚠️ CRÍTICO**: **NÃO usar `localhost` em produção**
- **Formato**: `https://seu-dominio.vercel.app` ou `https://seu-dominio.com`
- **Preview**: Para preview deployments, pode usar `https://${VERCEL_URL}` (automático)

### Base de Dados

```env
DATABASE_URL=<supabase-connection-pooler-url>
```
- **Descrição**: URL do connection pooler do Supabase (para queries)
- **Formato**: `postgresql://user:password@host:port/database?pgbouncer=true`
- **⚠️ CRÍTICO**: Sem esta variável, a aplicação não consegue conectar à base de dados

```env
DIRECT_URL=<supabase-direct-url>
```
- **Descrição**: URL direta do Supabase (para migrations, sem pooler)
- **Formato**: `postgresql://user:password@host:port/database`
- **⚠️ CRÍTICO**: Necessário para `prisma migrate deploy`

### QR Codes

```env
QR_SECRET=<min-32-chars-secret>
```
- **Descrição**: Secret para assinatura de QR codes dos bilhetes
- **Mínimo**: 32 caracteres
- **Como gerar**: `openssl rand -base64 32`
- **⚠️ CRÍTICO**: Sem esta variável, QR codes não podem ser validados

### Email (Resend)

```env
RESEND_API_KEY=<resend-api-key>
```
- **Descrição**: API key do Resend (formato: `re_...`)
- **Onde obter**: https://resend.com/api-keys
- **⚠️ CRÍTICO**: Sem esta variável, emails não são enviados

```env
EMAIL_FROM=noreply@daowave.pt
```
- **Descrição**: Endereço de email de origem (com display name opcional)
- **Formato**: `Display Name <email@domain.com>` ou apenas `email@domain.com`
- **⚠️ CRÍTICO**: Deve ser um domínio verificado no Resend

```env
APP_URL=https://daowave-beta.vercel.app
```
- **Descrição**: URL base da aplicação (usada em links de emails)
- **⚠️ CRÍTICO**: **NÃO usar `localhost` em produção**
- **Formato**: `https://seu-dominio.vercel.app` ou `https://seu-dominio.com`

## 🔧 Variáveis Opcionais (mas Recomendadas)

### Pagamentos (Stripe)

```env
STRIPE_SECRET_KEY=<stripe-secret-key>
```
- **Descrição**: Secret key do Stripe (formato: `sk_live_...` ou `sk_test_...`)
- **Onde obter**: https://dashboard.stripe.com/apikeys
- **Nota**: Use `sk_test_...` para staging, `sk_live_...` para produção

```env
STRIPE_PUBLISHABLE_KEY=<stripe-publishable-key>
```
- **Descrição**: Publishable key do Stripe (formato: `pk_live_...` ou `pk_test_...`)
- **Onde obter**: https://dashboard.stripe.com/apikeys
- **Nota**: Use `pk_test_...` para staging, `pk_live_...` para produção

```env
STRIPE_WEBHOOK_SECRET=<stripe-webhook-secret>
```
- **Descrição**: Secret do webhook do Stripe (formato: `whsec_...`)
- **Onde obter**: https://dashboard.stripe.com/webhooks
- **Nota**: Necessário para validar webhooks do Stripe

### Observabilidade (Sentry)

```env
SENTRY_DSN=<sentry-dsn>
```
- **Descrição**: DSN do Sentry para error tracking
- **Formato**: `https://...@...sentry.io/...`
- **Onde obter**: https://sentry.io/settings/projects/.../keys/

```env
SENTRY_ENV=production
```
- **Descrição**: Ambiente do Sentry (development, staging, production)
- **Valores**: `development`, `staging`, `production`

### Redis (Opcional - para queues de PDF e email)

```env
REDIS_URL=redis://default:password@host:port
```
- **Descrição**: URL completa do Redis (formato Upstash)
- **Formato**: `redis://default:password@host:port` ou `rediss://default:password@host:port` (SSL)
- **Onde obter**: Upstash Dashboard → Redis → REST API → Connection String
- **Nota**: Se não configurado, queues de PDF e email não funcionarão (mas app funciona)

**Alternativa (Redis tradicional):**
```env
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```
- **Descrição**: Configuração tradicional do Redis (host, port, password)
- **Nota**: `REDIS_URL` tem prioridade sobre `REDIS_HOST`/`REDIS_PORT`

### CORS

```env
CORS_ORIGINS=https://daowave-beta.vercel.app,https://daowave.pt
```
- **Descrição**: Lista separada por vírgulas de origens permitidas para CORS
- **Formato**: CSV (ex: `https://domain1.com,https://domain2.com`)
- **Nota**: Usado no middleware para headers CORS

## 📋 Checklist de Configuração no Vercel

### 1. Aceder ao Dashboard

1. Ir para https://vercel.com/dashboard
2. Selecionar o projeto
3. Ir para **Settings → Environment Variables**

### 2. Adicionar Variáveis

Para cada variável obrigatória:

1. Clicar em **Add New**
2. **Name**: Nome da variável (ex: `NEXTAUTH_SECRET`)
3. **Value**: Valor da variável
4. **Environment**: Selecionar:
   - ✅ **Production** (para produção)
   - ✅ **Preview** (para preview deployments)
   - ⚠️ **Development** (opcional, apenas se usar Vercel CLI localmente)

### 3. Verificar Variáveis Críticas

Certifique-se de que estas variáveis **NÃO** contêm `localhost`:

- ✅ `NEXTAUTH_URL` → deve ser `https://seu-dominio.vercel.app`
- ✅ `APP_URL` → deve ser `https://seu-dominio.vercel.app`

### 4. Redeploy após Alterações

Após adicionar/alterar variáveis:

1. Ir para **Deployments**
2. Clicar nos 3 pontos (...) no último deployment
3. Selecionar **Redeploy**

Ou fazer push de um novo commit para trigger automático.

## 🔍 Verificação de Logs no Vercel

### Ver Logs do Middleware

1. Ir para **Dashboard → Project → Runtime Logs**
2. Selecionar **Edge** (para logs do middleware)
3. Filtrar por `[middleware]` para ver apenas logs do middleware

### Logs Esperados

- `[middleware] entry` - Entrada no middleware (todas as requests)
- `[middleware] middleware_auth_error` - Erro na autenticação (getToken falhou)
- `[middleware] middleware_unexpected_error` - Erro inesperado (catch-all)

### Troubleshooting

#### Erro: "MIDDLEWARE_INVOCATION_FAILED" (500)

**Possíveis causas:**
1. `NEXTAUTH_SECRET` não configurado ou muito curto (< 32 chars)
2. `NEXTAUTH_URL` é `localhost` em produção
3. Import de módulo não Edge-safe no middleware (ex: `lib/env`, `lib/config`)
4. `getToken` falhou por causa de secret incorreto ou JWT malformado
5. Uso de APIs Node.js no middleware (crypto, fs, etc.)

**Solução:**
1. Verificar logs do Edge Runtime no Vercel (Dashboard → Runtime Logs → Edge)
2. Verificar se `NEXTAUTH_SECRET` está configurado e tem ≥ 32 caracteres
3. Verificar se `NEXTAUTH_URL` não é `localhost` (deve ser URL pública)
4. Verificar se não há imports de `lib/env` ou `lib/config` no middleware
5. Verificar se o middleware usa apenas APIs Edge-compatíveis
6. Se o erro persistir, verificar se há stack trace nos logs do Edge

**Diagnóstico passo a passo:**
1. Ver logs do Edge Runtime no Vercel
2. Procurar por `[middleware] middleware_auth_error` ou `[middleware] middleware_unexpected_error`
3. Se não houver logs, o middleware pode estar falhando antes de executar (verificar imports)
4. Se houver `middleware_auth_error`, verificar `NEXTAUTH_SECRET` e `NEXTAUTH_URL`
5. Se houver `middleware_unexpected_error`, verificar stack trace para identificar API incompatível

#### Erro: "NEXTAUTH_SECRET not configured"

**Causa**: Variável `NEXTAUTH_SECRET` não está configurada no Vercel.

**Solução**: Adicionar `NEXTAUTH_SECRET` nas Environment Variables do Vercel.

#### Rotas protegidas não redirecionam

**Causa**: `NEXTAUTH_SECRET` não configurado ou muito curto.

**Solução**: 
1. Verificar se `NEXTAUTH_SECRET` está configurado
2. Verificar se tem pelo menos 32 caracteres
3. Redeploy após alterações

## 📝 Notas Finais

- **Nunca commitar** variáveis de ambiente no código
- **Sempre usar** o dashboard do Vercel para configurar env vars
- **Verificar** que `NEXTAUTH_URL` e `APP_URL` não são `localhost` em produção
- **Redeploy** após alterar variáveis de ambiente
- **Verificar logs** do Edge Runtime se houver problemas

## 🔗 Links Úteis

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [NextAuth.js Configuration](https://next-auth.js.org/configuration/options)
- [Resend API Keys](https://resend.com/api-keys)
- [Stripe API Keys](https://dashboard.stripe.com/apikeys)
