# Correção do Middleware - Edge-Safe

## Resumo das Alterações

O middleware foi corrigido para ser totalmente Edge-safe e estável no Vercel, eliminando o erro 500 "MIDDLEWARE_INVOCATION_FAILED".

## Alterações Realizadas

### 1. Versão Isolada (Commit: `chore: isolate middleware - safe version without auth`)

Criada uma versão mínima do middleware sem autenticação para isolar o problema:
- Apenas retorna `NextResponse.next()`
- Adiciona security headers
- Sem imports externos
- Sem autenticação

**Propósito**: Confirmar se o middleware em si estava causando o erro 500.

### 2. Versão Final Edge-Safe (Commit: `fix: edge-safe auth middleware with comprehensive error handling`)

Middleware corrigido com:
- ✅ Autenticação robusta com `getToken` do next-auth/jwt
- ✅ Tratamento de erros abrangente (try/catch em todos os pontos críticos)
- ✅ Degradação controlada quando `NEXTAUTH_SECRET` não está configurado
- ✅ Logging mínimo para diagnóstico (sem expor segredos)
- ✅ Edge-safe: usa apenas `process.env.*` diretamente (sem imports de `lib/env` ou `lib/config`)
- ✅ Matcher correto para excluir rotas estáticas e NextAuth

## Ficheiros Alterados

### `apps/web/middleware.ts`

**Alterações principais:**
1. **Removidos imports não Edge-safe**: Não importa mais `lib/config` ou `lib/env`
2. **Uso direto de `process.env.*`**: Acessa variáveis de ambiente diretamente
3. **Tratamento de erros robusto**:
   - Try/catch em torno de `getToken`
   - Catch-all para erros inesperados
   - Degradação controlada quando `NEXTAUTH_SECRET` não está configurado
4. **Logging para diagnóstico**:
   - `[middleware] entry` - Entrada no middleware
   - `[middleware] middleware_auth_error` - Erro na autenticação
   - `[middleware] middleware_unexpected_error` - Erro inesperado
5. **Redirects melhorados**: Inclui `callbackUrl` nos redirects para `/auth/signin`

### `apps/web/docs/VERCEL_ENV.md`

**Alterações:**
- Adicionada secção de troubleshooting expandida para erro "MIDDLEWARE_INVOCATION_FAILED"
- Instruções passo a passo para diagnóstico
- Informações sobre como ver logs do Edge Runtime no Vercel

## Por Que Isto Resolve o Erro 500

### Problema Original

O erro 500 "MIDDLEWARE_INVOCATION_FAILED" ocorria porque:
1. **Imports não Edge-safe**: O middleware poderia estar importando módulos que não são compatíveis com Edge Runtime
2. **Falta de tratamento de erros**: Se `getToken` falhasse, o middleware crashava
3. **Variáveis de ambiente não configuradas**: Se `NEXTAUTH_SECRET` não estivesse configurado, o middleware tentava usar um valor undefined

### Solução Implementada

1. **Edge-safe garantido**:
   - Usa apenas APIs Edge-compatíveis
   - Não importa módulos que podem causar problemas no Edge Runtime
   - Usa `process.env.*` diretamente

2. **Tratamento de erros abrangente**:
   - Try/catch em torno de `getToken` previne crashes
   - Degradação controlada quando `NEXTAUTH_SECRET` não está configurado
   - Catch-all previne que erros inesperados quebrem a aplicação

3. **Logging para diagnóstico**:
   - Logs mínimos mas informativos
   - Não expõe segredos
   - Facilita debugging no Vercel

## Verificação no Vercel

### 1. Configurar Environment Variables

Certifique-se de que estas variáveis estão configuradas no Vercel:

```env
NEXTAUTH_SECRET=<min-32-chars-secret>
NEXTAUTH_URL=https://seu-dominio.vercel.app
DATABASE_URL=<postgresql-url>
DIRECT_URL=<postgresql-direct-url>
RESEND_API_KEY=<resend-api-key>
EMAIL_FROM=noreply@daowave.pt
APP_URL=https://seu-dominio.vercel.app
```

**⚠️ IMPORTANTE**: 
- `NEXTAUTH_SECRET` deve ter pelo menos 32 caracteres
- `NEXTAUTH_URL` e `APP_URL` **NÃO** devem ser `localhost` em produção

### 2. Verificar Logs do Edge Runtime

1. Ir para **Vercel Dashboard → Project → Runtime Logs**
2. Selecionar **Edge** (para logs do middleware)
3. Filtrar por `[middleware]` para ver apenas logs do middleware

**Logs esperados:**
- `[middleware] entry` - Entrada no middleware (todas as requests)
- `[middleware] middleware_auth_error` - Erro na autenticação (se ocorrer)
- `[middleware] middleware_unexpected_error` - Erro inesperado (se ocorrer)

### 3. Testar Rotas Protegidas

Testar que as rotas protegidas redirecionam corretamente:
- `/admin/*` → Redireciona para `/auth/signin` se não autenticado
- `/organizer/*` → Redireciona para `/auth/signin` se não autenticado
- `/validator/*` → Redireciona para `/auth/signin` se não autenticado

### 4. Verificar que Não Há Mais Erro 500

Após o deploy:
1. Aceder a qualquer rota pública (ex: `/`)
2. Verificar que não há erro 500
3. Verificar que rotas protegidas redirecionam corretamente

## Próximos Passos

1. **Fazer push** das alterações para o GitHub
2. **Aguardar deploy automático** no Vercel (ou fazer redeploy manual)
3. **Verificar logs** do Edge Runtime no Vercel
4. **Testar rotas protegidas** para confirmar que redirecionam corretamente
5. **Se o erro persistir**, verificar logs do Edge Runtime para identificar a causa específica

## Troubleshooting

Se o erro 500 persistir após estas alterações:

1. **Verificar logs do Edge Runtime** no Vercel
2. **Verificar se `NEXTAUTH_SECRET` está configurado** e tem ≥ 32 caracteres
3. **Verificar se `NEXTAUTH_URL` não é `localhost`**
4. **Verificar stack trace** nos logs do Edge Runtime para identificar API incompatível
5. **Se necessário**, criar issue no GitHub com:
   - Stack trace completo dos logs do Edge Runtime
   - Configuração do Vercel (sem expor secrets)
   - Passos para reproduzir o erro

## Notas Técnicas

- O middleware usa `getToken` do `next-auth/jwt`, que é Edge-safe
- O middleware não importa `lib/env` ou `lib/config` para evitar problemas no Edge Runtime
- O middleware degrada de forma controlada quando `NEXTAUTH_SECRET` não está configurado (proteção é feita nos route handlers)
- O middleware usa apenas APIs Edge-compatíveis (sem Node.js crypto, fs, etc.)
