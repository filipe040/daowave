# Área de Perfil do Utilizador (Buyer/User) — Entregáveis

Implementação da área de conta completa: bilhetes, compras, segurança e preferências. Sem alterações em Promotor/Admin.

---

## 1. Ficheiros alterados e criados

### Prisma
- **`apps/web/prisma/schema.prisma`** — Alterado: campos em `User` (avatarUrl, phone, emailVerifiedAt, lastLoginAt, termsAcceptedAt, termsVersion, marketingOptIn, notifyEmail, notifyEventReminders, notifyTransfers); modelo `UserSession` adicionado.
- **`apps/web/prisma/migrations/20260129120000_user_profile_sessions/migration.sql`** — Criado: migração MariaDB-compatível (sem `IF NOT EXISTS`).

### API (App Router)
- **`apps/web/app/api/account/profile/route.ts`** — Alterado: GET com novos campos; PATCH com nome, avatarUrl, phone.
- **`apps/web/app/api/account/orders/route.ts`** — Criado: GET histórico de compras.
- **`apps/web/app/api/account/sessions/route.ts`** — Criado: GET sessões ativas/revogadas.
- **`apps/web/app/api/account/sessions/revoke/route.ts`** — Criado: POST revogar sessão por id.
- **`apps/web/app/api/account/sessions/revoke-all/route.ts`** — Criado: POST revogar todas as sessões.
- **`apps/web/app/api/account/notifications/route.ts`** — Criado: PATCH preferências de notificação.
- **`apps/web/app/api/account/tickets/route.ts`** — Alterado: GET bilhetes do utilizador.
- **`apps/web/app/api/account/tickets/[id]/route.ts`** — Criado: GET detalhe do bilhete (ownership).
- **`apps/web/app/api/account/tickets/[id]/resend/route.ts`** — Criado: POST reenviar email do bilhete.
- **`apps/web/app/api/account/tickets/[id]/transfer/initiate/route.ts`** — Criado: POST iniciar transferência por email.
- **`apps/web/app/api/account/legal/export/route.ts`** — Criado: POST exportar dados do utilizador (JSON).
- **`apps/web/app/api/account/legal/delete/route.ts`** — Criado: POST apagar conta (com confirmação).
- **`apps/web/app/api/checkout/[orderId]/confirm/route.ts`** — Alterado: tipagem do body (Record<string, unknown>) para corrigir build.

### Páginas e layout (Account)
- **`apps/web/app/account/layout.tsx`** — Criado: layout protegido por sessão.
- **`apps/web/app/account/components/account-layout-client.tsx`** — Criado: cliente do layout (sidebar + conteúdo).
- **`apps/web/app/account/components/account-sidebar.tsx`** — Criado: sidebar com links (dashboard, perfil, segurança, notificações, encomendas, bilhetes, legal).
- **`apps/web/app/account/page.tsx`** — Alterado: dashboard com cards de resumo (Compras, Bilhetes).
- **`apps/web/app/account/profile/page.tsx`** — Criado: página de perfil.
- **`apps/web/app/account/components/account-profile.tsx`** — Existente/alterado: edição de dados pessoais (nome, avatar, telefone).
- **`apps/web/app/account/security/page.tsx`** — Criado: página de segurança.
- **`apps/web/app/account/components/account-security.tsx`** — Criado: listar sessões, revogar sessão/todas, alterar password; data-testid em botões críticos.
- **`apps/web/app/account/notifications/page.tsx`** — Criado: página de notificações.
- **`apps/web/app/account/components/account-notifications.tsx`** — Criado: switches (email, lembretes, transferências, marketing).
- **`apps/web/app/account/orders/page.tsx`** — Criado: histórico de encomendas.
- **`apps/web/app/account/components/account-orders.tsx`** — Criado: lista de compras com evento, estado, valor e data.
- **`apps/web/app/account/tickets/page.tsx`** — Criado: lista de bilhetes.
- **`apps/web/app/account/components/account-tickets.tsx`** — Criado: cards por estado (VALID/USED/EXPIRED/TRANSFERRED), link para detalhe.
- **`apps/web/app/account/tickets/[id]/page.tsx`** — Criado: detalhe do bilhete (dados serializados para cliente).
- **`apps/web/app/account/components/ticket-detail.tsx`** — Criado: QR, download PDF, reenviar email, modal de transferência; toasts e data-testid.
- **`apps/web/app/account/legal/page.tsx`** — Criado: termos e legal.
- **`apps/web/app/account/components/account-legal.tsx`** — Criado: exportar dados, apagar conta com confirmação; data-testid.

### Outros
- **`docs/ACCOUNT_DELIVERABLES.md`** — Este ficheiro.

---

## 2. Instruções de migração (Prisma) e deploy

### Pré-requisitos
- Node 18+
- MySQL ou MariaDB com utilizador e base de dados configurados em `DATABASE_URL`.

### Migração em desenvolvimento
```bash
cd apps/web
npx prisma migrate deploy
# ou, para criar nova migração a partir do schema:
# npx prisma migrate dev --name descricao_alteracao
npx prisma generate
```

### Deploy (produção / VPS)
1. **Backup da base de dados** antes de correr migrações:
   ```bash
   mysqldump -u USER -p DATABASE_NAME > backup_pre_account_$(date +%Y%m%d).sql
   ```
2. Garantir que `DATABASE_URL` em produção aponta para a base correta.
3. Aplicar migrações:
   ```bash
   cd apps/web
   npx prisma migrate deploy
   npx prisma generate
   ```
4. (Re)iniciar a aplicação Next.js (PM2, systemd, Docker, etc.).

**Nota:** A migração `20260129120000_user_profile_sessions` adiciona colunas à tabela `User` e cria a tabela `UserSession`. Se alguma coluna já existir (por migração manual anterior), a migração pode falhar; nesse caso, ver secção 3 (MariaDB).

---

## 3. Notas de compatibilidade MariaDB

- **Sem `ADD COLUMN IF NOT EXISTS`** — A migração usa apenas `ALTER TABLE ... ADD COLUMN`. Em MariaDB/MySQL que não suportam `IF NOT EXISTS` em colunas, isto é intencional: a migração deve ser aplicada numa base “limpa” para esse passo, ou as colunas já existentes devem ter sido criadas por migração anterior.
- **Sem `ADD CONSTRAINT IF NOT EXISTS`** — O ficheiro usa `CREATE TABLE` e `ALTER TABLE ... ADD CONSTRAINT` normais. Em ambientes onde a tabela `UserSession` ou o FK já existem, será necessário adaptar ou correr apenas os `ALTER TABLE User` que faltem (por cópia manual do SQL).
- **Charset:** `DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci` na `UserSession` para alinhar com o resto do projeto.
- **Ordem das migrações:** O timestamp `20260129120000` coloca esta migração depois da init e de migrações antigas; em bases novas, usar `prisma migrate deploy` na ordem definida pela pasta `migrations`.

Se já tiveres parte das colunas em `User` (por exemplo `avatarUrl` noutra migração), podes:
- comentar no SQL da migração as linhas `ALTER TABLE User ADD COLUMN ...` que já existam, ou
- criar uma migração “vazia” após aplicar manualmente os ALTERs em falta e garantir que o schema Prisma está sincronizado.

---

## 4. Comandos para testar localmente e na VPS

### Local
```bash
# Raiz do monorepo
cd /Users/santos/Documents/App_bilheteira

# Instalar dependências
npm install

# Base de dados (ex.: MariaDB/MySQL local ou Docker)
# Garantir DATABASE_URL em apps/web/.env

# Aplicar migrações e gerar cliente Prisma
cd apps/web && npx prisma migrate deploy && npx prisma generate && cd ../..

# Build (obrigatório passar)
npm run build

# Servidor de desenvolvimento
npm run dev
# Abrir http://localhost:3000 e testar:
# - /account (dashboard)
# - /account/profile
# - /account/security
# - /account/notifications
# - /account/orders
# - /account/tickets
# - /account/tickets/[id]
# - /account/legal
```

### E2E (Playwright) — local
```bash
# Com a app a correr noutro terminal (npm run dev)
PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test --reporter=line --workers=1
```

### VPS / Produção
```bash
# No servidor
cd /caminho/para/App_bilheteira
git pull   # ou deploy por outro meio

npm ci
cd apps/web
npx prisma migrate deploy
npx prisma generate
cd ../..
npm run build

# Reiniciar processo (exemplo com PM2)
# pm2 restart web
# ou
# systemctl restart your-next-app
```

### Verificação rápida após deploy
- Aceder a `https://seu-dominio/account` com utilizador autenticado (role USER/Buyer).
- Confirmar que sidebar, bilhetes, encomendas, segurança, notificações e legal carregam sem 404.
- Testar exportar dados e (opcional) revogar uma sessão em `/account/security`.

---

**Build:** `npm run build` deve passar sem erros.  
**E2E:** Os botões críticos têm `data-testid` para testes (ex.: `revoke-session`, `save-password`, `legal-export`).
