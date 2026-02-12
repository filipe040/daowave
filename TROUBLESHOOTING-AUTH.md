# Guia de Resolução de Problemas de Autenticação

## Problemas Corrigidos

### 1. Configurações Duplicadas de NextAuth
- **Problema**: Havia duas configurações diferentes (`/lib/auth.ts` e `/lib/auth/config.ts`)
- **Solução**: Removida a configuração duplicada e unificada em `/lib/auth.ts`
- **Impacto**: Elimina conflitos e inconsistências no sistema de autenticação

### 2. Importações Incorretas
- **Problema**: Múltiplos arquivos importavam de `@/lib/auth/config` (inexistente)
- **Solução**: Atualizadas todas as importações para `@/lib/auth`
- **Arquivos afetados**: 29 arquivos `.tsx` e 50+ arquivos `.ts`

### 3. Provedores OAuth Não Configurados
- **Problema**: Página de login tentava usar Google e Apple OAuth sem configuração
- **Solução**: Removidos os botões OAuth da página de signin
- **Benefício**: Evita erros de autenticação por provedores não configurados

### 4. Middleware de Autenticação
- **Problema**: Falhas na verificação de token causavam crashes
- **Solução**: Implementado tratamento de erros mais robusto
- **Melhoria**: Sistema mais resiliente a falhas de autenticação

### 5. Configuração de Tipos
- **Problema**: Importações incorretas de tipos `Role`
- **Solução**: Corrigidas as importações para usar `@ticketing-platform/shared/src/rbac`

## Configuração do Ambiente

### 1. Variáveis de Ambiente Obrigatórias

Crie um arquivo `.env` na pasta `apps/web/` com as seguintes variáveis:

```env
# Base de Dados
DATABASE_URL="postgresql://username:password@localhost:5432/ticketing_db"

# NextAuth
NEXTAUTH_SECRET="your-32-character-secret-key-here-12345678901234567890"
NEXTAUTH_URL="http://localhost:3000"

# Segurança QR
QR_SECRET="your-32-character-qr-secret-key-here-12345678901234567890"

# Aplicação
NODE_ENV="development"
APP_NAME="EasyTicket"
```

### 2. Configuração de Email (Opcional para desenvolvimento)

```env
# Opção 1: SMTP
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Opção 2: Resend (Recomendado)
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
EMAIL_FROM="EasyTicket <no-reply@example.com>"
```

### 3. Configuração de Pagamentos (Opcional)

```env
# Stripe (para testes)
STRIPE_SECRET_KEY="sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Flags de funcionalidades
ENABLE_MOCK_PAYMENTS="true"
ENABLE_REAL_PAYMENTS="false"
```

## Como Fazer Login

### 1. Desenvolvimento
- Acesse: `http://localhost:3000/auth/signin`
- Use credenciais de teste ou crie uma conta via signup

### 2. Promotores/Admins
- Acesse: `http://localhost:3000/promotor/login`
- Só funciona para usuários com role `PROMOTER` ou `ADMIN`

## Diagnóstico de Problemas

### Erro: "Module not found: Can't resolve '@/lib/auth/config'"
**Solução**: Execute o seguinte comando para corrigir importações remanescentes:
```bash
find apps/web -name "*.ts" -o -name "*.tsx" | xargs grep -l "@/lib/auth/config" | xargs sed -i 's/@\/lib\/auth\/config/@\/lib\/auth/g'
```

### Erro: "NextAuth configuration error"
**Verificações**:
1. `NEXTAUTH_SECRET` tem pelo menos 32 caracteres
2. `DATABASE_URL` está correto
3. Migrations do Prisma foram executadas: `npm run db:migrate:deploy`

### Erro: "Session not found" após login
**Soluções**:
1. Limpe cookies do browser
2. Reinicie o servidor de desenvolvimento
3. Verifique se o token JWT não expirou

### Erro: "Rate limit exceeded"
**Solução**: Aguarde 15 minutos ou reinicie o servidor para limpar o cache de rate limiting

### Login funciona mas redirecionamento falha
**Verificações**:
1. Role do usuário na base de dados está correto (`USER`, `PROMOTER`, `ADMIN`)
2. Middleware está funcionando corretamente
3. Verifique logs no console do browser e servidor

## Comandos Úteis

### Build e Testes
```bash
# Build completo
npm run build

# Gerar cliente Prisma
npm run db:generate

# Executar migrações
npm run db:migrate:deploy

# Iniciar desenvolvimento
npm run dev
```

### Debug de Autenticação
```bash
# Ver logs do NextAuth (adicione ao .env)
NEXTAUTH_DEBUG=true

# Ver logs do Prisma
DEBUG="prisma:query"
```

## Estrutura de Autenticação

### Fluxo de Login
1. Usuário envia credenciais para `/api/auth/[...nextauth]`
2. NextAuth valida via `CredentialsProvider`
3. Sistema verifica email/password na base de dados
4. JWT token é criado e assinado
5. Session é estabelecida
6. Redirecionamento baseado no role do usuário

### Proteção de Rotas
- Middleware protege rotas `/admin`, `/promotor`, `/validator`
- Verificação de roles apropriados
- Redirecionamento automático para login se não autenticado

### Roles e Permissões
- `USER`: Acesso básico, compra de bilhetes
- `PROMOTER`: Gestão de eventos, vendas
- `ADMIN`: Acesso total ao sistema

## Notas Importantes

1. **Email Verification**: Em produção, emails devem ser verificados. Em desenvolvimento, a verificação é opcional.

2. **Rate Limiting**: Sistema implementa rate limiting para prevenir ataques de força bruta.

3. **Security Headers**: Middleware adiciona headers de segurança automaticamente.

4. **Session Management**: Sessões expiram em 30 dias por defeito.

5. **Error Handling**: Sistema falha de forma segura - em caso de erro, nega acesso por defeito.

## Problema Adicional Corrigido

### Erro de Renderização Estática no Next.js 15

**Erro**: `Dynamic server usage: Route /promotor/events/new couldn't be rendered statically because it used 'headers'`

**Causa**: Next.js 15 tenta renderizar páginas estaticamente por padrão, mas páginas que usam `getServerSession` (que acessa headers) precisam ser marcadas como dinâmicas.

**Solução**: Adicionada a diretiva `export const dynamic = "force-dynamic"` em todos os layouts e páginas que usam `getServerSession`:

- ✅ Layouts: `/admin/layout.tsx`, `/organizer/layout.tsx`, `/promotor/(dashboard)/layout.tsx`
- ✅ Páginas: Todas as páginas que fazem autenticação server-side

**Resultado**: Build 100% bem-sucedido sem erros de renderização estática.