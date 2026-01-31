# Mapeamento do Repositório e Plano de Refatoração — Dashboards PROMOTOR e ADMIN

## 1. Análise da Arquitetura Atual

### 1.1 Estrutura de Pastas (Monorepo)

```
App_bilheteira/
├── apps/
│   ├── web/                    # Aplicação principal (Next.js)
│   │   ├── app/                # App Router (rotas, páginas, API)
│   │   ├── components/        # UI partilhada (shadcn/ui)
│   │   ├── lib/                # Lógica: auth, prisma, qr, email, stripe, security
│   │   ├── prisma/             # Schema + migrations
│   │   ├── scripts/            # Utilitários (DB, roles, deploy)
│   │   ├── tests/              # e2e, integration, unit
│   │   └── types/
│   └── validator/             # App separada (PWA validator) — mínima
├── packages/
│   └── shared/                 # Tipos + RBAC + QR (Role, SessionUser, SyncTicket, etc.)
├── infra/                      # (opcional) infra
├── docker-compose.yml          # MariaDB + MinIO
├── package.json                # Workspaces: apps/web, packages/*
└── turbo.json
```

### 1.2 Stack Detetada

| Camada | Tecnologia | Notas |
|--------|------------|--------|
| **Frontend** | Next.js 15 (App Router) + React 18 + TypeScript | Tailwind, Radix UI, Recharts, react-hook-form, zod |
| **Backend** | Next.js API Routes (REST) | Sem Express; rotas em `app/api/*/route.ts` |
| **DB** | **MySQL** (schema Prisma) | `provider = "mysql"` em schema.prisma; docker-compose usa **MariaDB** (compatível) |
| **ORM** | Prisma 5.x | `apps/web/prisma/schema.prisma` |
| **Auth** | NextAuth.js 4.x | JWT strategy, Credentials + Google + Apple; roles em token/session |
| **Pagamentos** | Stripe + camada abstrata | `lib/stripe.ts`, `lib/payment/`, webhooks |
| **QR / Check-in** | HMAC-SHA256 (lib/qr/hmac.ts) | Payload assinado: ticketId, code, exp; verify em API |
| **Email** | Resend / Nodemailer | `lib/email-service.ts`, templates |
| **Storage** | AWS S3 / MinIO | `lib/storage.ts`, uploads de assets |
| **Rate limit** | In-memory (lib/security/rate-limit.ts) | Não Redis; útil para rotas sensíveis |
| **Logging** | Sentry (opcional) | `sentry.*.config.ts` |
| **i18n** | Não implementado | Texto em PT hardcoded; sem ficheiros de tradução |

**Nota:** O README menciona PostgreSQL, mas o `schema.prisma` e o `docker-compose` usam **MySQL/MariaDB**. A stack efetiva é MySQL + Prisma.

### 1.3 Autenticação e Autorização Atuais

- **NextAuth** com JWT: `id`, `email`, `name`, `role` no token.
- **Roles (enum Prisma + lib/auth/permissions.ts):**
  - `USER` — comprador
  - `PROMOTER` — promotor (tem `PromoterProfile`, status PENDING/APPROVED/REJECTED)
  - `ADMIN` — administrador
- **Middleware** (`middleware.ts`): protege `/admin`, `/organizer`, `/validator`; usa `getToken` (Edge); redireciona não autenticados para signin.
- **Permissões:** funções em `lib/auth/permissions.ts`: `canAccessAdminArea`, `canAccessOrganizerArea`, `canManageEvent`, etc. **Não existe** RBAC fino (scopes por recurso); apenas role binário (admin vs promoter vs user).
- **Packages/shared:** `rbac.ts` com `Role` e `canAccessAdmin` / `canAccessOrganizer` / `canAccessValidator`.

### 1.4 Modelo de Dados Atual (Prisma)

- **User** — id, email, passwordHash, role (USER|PROMOTER|ADMIN), emailVerified, etc.
- **PromoterProfile** — userId, brandName, vatNumber, status (PENDING|APPROVED|REJECTED).
- **Event** — promoterId, title, slug, description, venue, city, startAt, endAt, status (DRAFT|PUBLISHED), branding (bannerUrl, etc.), checkin (checkinMode, checkinStartAt, checkinEndAt, maxEntries).
- **TicketLot** — eventId, name, priceCents, quantityTotal, quantitySold, saleStartAt, saleEndAt (equivale a “ticket type” + “lot”).
- **Order** — userId, eventId, totalCents, status (PENDING|PAID|CANCELED).
- **OrderItem** — orderId, ticketLotId, quantity, unitPriceCents.
- **Ticket** — orderId, eventId, userId, ticketLotId, code (unique), qrPayload, checkedInAt, checkedInByUserId, entriesUsed, lastCheckinAt.
- **CheckinLog** — ticketId, eventId, validatorUserId, deviceId, result, scannedAt, rawPayloadHash, offline, syncedAt.
- **Coupon** — eventId, code, discountType (PERCENTAGE|FIXED), discountValue, maxUses, usedCount, startsAt, endsAt.
- **EventTeamMember** — eventId, userId, role (ADMIN|ORGANIZER|MANAGER|STAFF|VIEWER), permissions (EventTeamMemberPermission).
- **EventTeamMemberPermission** — memberId, permission (CREATE_EVENTS, SELL_TICKETS, VALIDATE_ENTRIES, VIEW_REPORTS, MANAGE_TEAMS).
- **AuditLog** — actorUserId, action, entityType, entityId, metaJson.
- **EmailLog**, **TransferLog**, **EventAsset**.

**O que já existe vs. objetivo:**  
Há eventos, bilhetes (TicketLot = tipo/lote), encomendas, check-in com QR assinado, cupões, equipas por evento com roles/permissões e audit log. **Não existe:** organizations (usa-se PromoterProfile como “organização”), tracking_links, payouts, fraud_signals, system_logs; nomenclatura “ticket_types”/“tiers” no schema é “TicketLot” (um nível).

### 1.5 Rotas Públicas (não quebrar)

- `/` — homepage
- `/events`, `/events/[slug]` — listagem e página do evento
- `/checkout`, `/checkout/[orderId]`, `/checkout/customer-info` — compra
- `/auth/signin`, `/auth/signup`, `/auth/forgot-password`, etc.
- `/contact`, `/help`, `/privacy`, `/terms`
- `/my-tickets`, `/ticket/[ticketId]` (área cliente após login)
- API: `/api/events`, `/api/events/[slug]`, `/api/checkout/*`, `/api/auth/*`, `/api/payments/*`, `/api/webhooks/stripe`

### 1.6 Áreas Protegidas Atuais

- **Promotor:** `/promotor` (dashboard unificado com admin); `/promotor/events`, `/promotor/events/[id]/*` (bilhetes, equipas, branding, settings, check-in, carteiras); `/promotor/checkin/[eventId]`; layout com DashboardShell + PromoterSidebar (secção ADMIN só para role ADMIN).
- **Organizer (legado?):** `/organizer` (dashboard), `/organizer/events`, `/organizer/events/[id]/edit`, `/organizer/events/new`, `/organizer/tickets`, `/organizer/coupons`, `/organizer/sales`; sidebar própria.
- **Admin:** `/admin` (redireciona para `/promotor`); `/admin/users`, `/admin/organizers`, `/admin/events`, `/admin/events/pending`, `/admin/events/new`, `/admin/payments`, `/admin/audit`, `/admin/system`, `/admin/settings`, `/admin/fix-session`; layout usa o mesmo DashboardShell (promotor) com itens de menu admin.
- **Validator:** `/validator`; API `/api/validator/*` (checkin, validate, sync).

### 1.7 API Atual (resumo)

- **Auth:** NextAuth `[...nextauth]`, signup, verify-email, forgot-password, reset-password.
- **Eventos públicos:** GET `/api/events`, GET `/api/events/[slug]`.
- **Checkout:** POST `/api/checkout`, `/api/checkout/[orderId]/customer-info`, create-payment-intent.
- **Payments:** confirm, webhook Stripe.
- **Account:** profile, password, export, tickets, transfer.
- **Organizer:** CRUD events, events/[id]/publish, events/[id]/tickets/lots, events/[id]/tickets/types.
- **Promotor:** events (list, create), events/[id]/* (archive, assets, badge-design, branding, settings, teams, ticket-lots), checkin/verify.
- **Admin:** events (CRUD, approve), organizers (approve, reject, register), users (search, promote-to-organizer), system/errors, verify-user.
- **Validator:** checkin, events, validate, sync.
- **Tickets:** GET by id, pdf, resend, transfer.

Não há camada explícita “services” ou “controllers”; a lógica está nas Route Handlers (e por vezes em lib/). Não há ficheiros de seed no repo (apenas referências a `db:seed` / `db:seed:staging` em scripts).

---

## 2. Plano de Refatoração (Passos Pequenos)

Princípio: **reaproveitar** DB, auth e rotas públicas; introduzir **camadas** (services, validação, RBAC) e **novos modelos/APIs** de forma incremental; unificar e completar dashboards **PROMOTOR** e **ADMIN** sem quebrar rotas públicas.

### Fase 1 — Fundações (sem quebrar nada)

1. **Documentar e alinhar DB**  
   - Confirmar MySQL/MariaDB como fonte de verdade; atualizar README se necessário.  
   - Manter schema Prisma atual; listar gaps vs. objetivos (organizations, tracking_links, payouts, fraud, etc.) para fases seguintes.

2. **Camada de serviços (incremental)**  
   - Criar `apps/web/lib/services/` (ou `server/services/`).  
   - Extrair lógica de negócio das route handlers para funções reutilizáveis (ex.: `EventService`, `OrderService`, `CheckinService`).  
   - Route handlers passam a chamar serviços + validação (Zod) + resposta HTTP.  
   - Fazer primeiro para 1–2 domínios (ex.: eventos promotor, check-in).

3. **RBAC fase 1**  
   - Manter roles atuais (USER, PROMOTER, ADMIN).  
   - Introduzir “permission scopes” em código (ex.: `event:read`, `event:write`, `sales:read`, `admin:users`).  
   - Mapear roles → scopes em `lib/auth/permissions.ts` (ou packages/shared).  
   - Middleware/helper que, em cada API protegida, verifica role + scope (sem alterar ainda o modelo de dados).  
   - Opcional: preparar enums para futuros ADMIN_PLATFORM, ADMIN_SUPPORT, PROMOTOR_OWNER, etc., sem migração ainda.

4. **Validação e segurança**  
   - Garantir Zod (ou equivalente) em todos os inputs de API sensíveis.  
   - Aplicar rate limit (lib existente) em login, signup, check-in scan, e outras rotas sensíveis.  
   - Manter NextAuth como está; não introduzir JWT/refresh separado nesta fase.

### Fase 2 — Modelo de Dados (incremental)

5. **Migrations incrementais**  
   - Se for necessário “organizations”: criar tabela `organizations` e migrar `PromoterProfile` para FK para `organization_id` (ou manter promoter = org por agora e só adicionar campos).  
   - Adicionar apenas o estritamente necessário: por exemplo `tracking_links`, `payouts`, campos de “score” ou estado em promotores/eventos.  
   - Manter nomes atuais (TicketLot, etc.) onde possível; criar views ou aliases em serviços se quiser nomenclatura “ticket_types”/“tiers”.

6. **Seed de dados**  
   - Criar `apps/web/prisma/seed.ts` (ou script equivalente) com: 1 promotor, 2 eventos, 3 lotes/tipos de bilhetes, 1 campanha (ex.: cupom), ~20 bilhetes/orders.  
   - Documentar no README: `npx prisma db seed` ou comando explícito.

### Fase 3 — API Completa PROMOTOR

7. **Endpoints PROMOTOR**  
   - GET `/api/promoter/overview` — KPIs (vendas hoje/semana/total, receita, bilhetes vs capacidade, eventos ativos).  
   - CRUD `/api/promoter/events` (reaproveitar/refatorar o que já existe em organizer/promotor).  
   - CRUD `/api/promoter/events/[id]/ticket-types` (+ tiers se existir modelo; senão apenas lotes).  
   - GET `/api/promoter/events/[id]/sales` (orders + filtros + export).  
   - POST `/api/promoter/events/[id]/checkin/scan` (validar QR, marcar usado, log; idempotente).  
   - GET `/api/promoter/events/[id]/checkins`.  
   - CRUD promo-codes e tracking-links (quando modelos existirem).  
   - GET `/api/promoter/analytics` (vendas por hora/dia; mínimo).  
   - GET `/api/promoter/finance` (gross, fees, net, payouts quando existir).  
   - CRUD `/api/promoter/team` (reaproveitar EventTeamMember).

8. **Paginação e filtros**  
   - Padrão único: query params `page`, `limit` (ou `cursor`); filtros por data, status, evento.  
   - Respostas com `data`, `total`, `page`, `limit`.

### Fase 4 — API Completa ADMIN

9. **Endpoints ADMIN**  
   - GET `/api/admin/overview` — GMV, receita plataforma, eventos ativos, promotores, bilhetes vendidos.  
   - CRUD `/api/admin/promoters` (aprovar/bloquear; score quando existir).  
   - CRUD `/api/admin/events` (moderar/aprovar/suspender).  
   - CRUD `/api/admin/users` (ban/reset; histórico = audit log).  
   - GET `/api/admin/finance`, `/api/admin/fraud` (mínimo: duplicados QR, ordens anómalas).  
   - GET `/api/admin/system` (logs/erros quando existir).  
   - CRUD `/api/admin/content` (banners/destaques — mínimo).  
   - GET `/api/admin/audit-logs`.

10. **Audit log**  
    - Garantir escrita em `AuditLog` em todas as ações admin e ações sensíveis de promotor (publicar evento, aprovar promotor, etc.).

### Fase 5 — Check-in QR e Segurança

11. **QR assinado (já existe HMAC)**  
    - Revisar `lib/qr/hmac.ts` e endpoint de scan: validar assinatura, estado do ticket (não usado / já usado), janela de check-in.  
    - Resposta “já usado” com hora e operador.  
    - Guardar `device_id` e `validator_user_id` em CheckinLog (já existe).  
    - Opcional: modo offline (cache de tickets válidos + fila de logs e sync quando online).

### Fase 6 — UI Dashboards

12. **PROMOTOR UI**  
    - Unificar numa única área `/promotor` (já parcialmente feito): Dashboard (KPIs + gráficos), Eventos, Bilhetes (tipos/lotes), Vendas (tabela + filtros + export), Check-in (scanner + lista + logs), Marketing (promo + tracking), Analytics, Financeiro, Equipa, Definições.  
    - Componentes: tabelas com paginação, filtros, estados loading/empty/error/success, timeout + fallback (sem “A carregar…” infinito).  
    - Proteção por RBAC (role + scopes) em cliente e servidor.

13. **ADMIN UI**  
    - Área `/admin` com menus: Dashboard, Promotores, Eventos, Utilizadores, Financeiro, Anti-fraude, Sistema, Conteúdo, Audit Logs, Definições.  
    - Mesmos padrões de tabelas, filtros e estados.  
    - Todas as ações com trilha de auditoria.

14. **i18n e UX**  
    - PT-PT consistente em toda a UI; opcional: ficheiros de tradução (next-intl ou similar) para escalar depois.

### Fase 7 — Qualidade e Entrega

15. **Testes**  
    - Unit para serviços críticos (check-in, QR, cálculo de receita).  
    - E2E smoke para: login, listagem de eventos públicos, checkout (se possível com mock), uma rota promotor e uma admin.

16. **Logging e README**  
    - Logging estruturado (já existe logger); garantir audit log em ações sensíveis.  
    - README: como correr migrations, seed, testar dashboards, lista de endpoints e permissões por role.

17. **Build e rotas públicas**  
    - Garantir que `npm run build` passa e que rotas públicas (homepage, eventos, checkout) continuam a funcionar após cada fase.

---

## 3. Resumo Executivo

- **Stack real:** Next.js 15, React 18, TypeScript, **MySQL/MariaDB**, Prisma, NextAuth (JWT), Tailwind, QR com HMAC, Stripe.  
- **Auth:** 3 roles (USER, PROMOTER, ADMIN); sem RBAC fino ainda.  
- **DB:** Modelo rico (eventos, lotes, orders, tickets, check-in, equipas, cupões, audit); faltam tracking_links, payouts, fraud/system logs para objetivos completos.  
- **Rotas públicas:** definidas e devem permanecer intactas.  
- **Refatoração:** em camadas (services → RBAC → migrations/seed → APIs promoter/admin → check-in → UI); tudo incremental, sem “big bang”, com testes e documentação no fim.

Este documento serve como base para implementar primeiro as fundações (Fase 1) e depois os dashboards PROMOTOR e ADMIN conforme os objetivos pedidos.
