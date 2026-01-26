# Plataforma de Bilhética - Marketplace + Validator Offline

Plataforma completa de venda de bilhetes nominais para eventos, com sistema de validação offline-first.

## 🎯 Características Principais

- **Bilhetes Nominais**: Todos os bilhetes requerem nome + email do participante
- **Transferência de Bilhetes**: Sistema completo com invalidação do QR antigo e emissão de novo
- **Check-in Configurável**: SINGLE (entrada única) ou MULTI (múltiplas entradas com limite)
- **Validator Offline**: PWA que funciona offline com sync antes/depois do evento
- **Pagamentos Multi-provider**: MBWay, Multibanco, PayPal (stubs para desenvolvimento)

## 🛠 Stack Técnica

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes (REST)
- **Database**: PostgreSQL + Prisma ORM
- **Autenticação**: NextAuth.js com RBAC (USER, ORGANIZER, ADMIN, VALIDATOR)
- **Pagamentos**: Camada abstrata com providers (MBWay, Multibanco, PayPal)
- **QR Codes**: Assinados com HMAC-SHA256 (contém ticketId, eventId, nonce, timestamp)
- **Infraestrutura**: Docker Compose (PostgreSQL)

## 📦 Estrutura do Monorepo

```
.
├── apps/
│   ├── web/              # Portal público + backoffice + área cliente
│   └── validator/        # PWA mobile-first para validação offline
├── packages/
│   └── shared/           # Tipos compartilhados + validação QR + schemas
├── infra/
│   └── docker-compose.yml
└── README.md
```

## 🚀 Setup e Instalação

### Pré-requisitos

- Node.js 20+
- Docker e Docker Compose

### 1. Clone e instale dependências

```bash
npm install
```

### 2. Inicie os serviços com Docker

```bash
cd infra
docker-compose up -d
```

Isto irá iniciar PostgreSQL na porta 5432.

### 3. Configure variáveis de ambiente

Crie `apps/web/.env`:

```env
DATABASE_URL="postgresql://app:app@localhost:5432/tickets"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="gerar-secret-aleatorio-aqui"
QR_SECRET="gerar-secret-aleatorio-para-qr-aqui"
```

## 🌐 Env Vars Required on Vercel

**⚠️ IMPORTANTE**: Para deploy em produção no Vercel, configure estas variáveis de ambiente.

📖 **Documentação completa**: Ver [`docs/VERCEL_ENV.md`](docs/VERCEL_ENV.md) para lista detalhada, troubleshooting e checklist.

### Obrigatórias (Production + Preview):

```env
DATABASE_URL=<supabase-connection-pooler-url>
DIRECT_URL=<supabase-direct-url>
NEXTAUTH_SECRET=<min-32-chars-secret>
NEXTAUTH_URL=https://daowave-beta.vercel.app  # ⚠️ NÃO usar localhost em produção!
QR_SECRET=<min-32-chars-secret>
RESEND_API_KEY=<resend-api-key>
EMAIL_FROM=noreply@daowave.pt
APP_URL=https://daowave-beta.vercel.app  # ⚠️ NÃO usar localhost em produção!
```

### Opcionais (mas recomendadas):

```env
STRIPE_SECRET_KEY=<stripe-secret-key>
STRIPE_PUBLISHABLE_KEY=<stripe-publishable-key>
SENTRY_DSN=<sentry-dsn>
CORS_ORIGINS=https://daowave-beta.vercel.app,https://daowave.pt  # CSV de origens permitidas
```

### ⚠️ Notas Importantes:

- **NEXTAUTH_URL**: Deve ser a URL pública da aplicação (ex: `https://daowave-beta.vercel.app`). **NÃO usar `localhost` em produção**.
- **APP_URL**: Deve ser a URL pública da aplicação. Usado para links em emails e redirects.
- **CORS_ORIGINS**: Lista separada por vírgulas de origens permitidas para CORS (opcional, usado no middleware).
- Todas as variáveis devem ser configuradas no dashboard do Vercel em **Settings → Environment Variables**.
- **Ver logs do middleware**: Dashboard → Deployments → Runtime Logs → Edge (procurar por `[middleware]`).

### 4. Configure o banco de dados

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

O seed cria utilizadores:
- **Admin**: admin@demo.pt / Password123!
- **Organizador**: org@demo.pt / Password123!
- **Validador**: val@demo.pt / Password123!
- **Utilizador**: user@demo.pt / Password123!

### 5. Inicie a aplicação

```bash
npm run dev:web
```

A aplicação estará disponível em http://localhost:3000

## 📋 Modelos de Dados

### Principais Entidades

- **User**: Utilizadores (USER, ORGANIZER, ADMIN, VALIDATOR)
- **Event**: Eventos com configuração de check-in (SINGLE/MULTI)
- **Ticket**: Bilhetes nominais (attendeeName, attendeeEmail) com holderUserId
- **Order**: Pedidos de compra com paymentProvider e paymentRef
- **TransferLog**: Logs de transferências de bilhetes
- **ValidatorAssignment**: Atribuição de validadores a eventos
- **CheckinLog**: Logs de validação (online e offline)

### Check-in Configurável

- **SINGLE**: Uma única entrada por bilhete
- **MULTI**: Múltiplas entradas até maxEntries (ou ilimitado se null)
- Janela de validação opcional (checkinStartAt, checkinEndAt)

## 🔐 Sistema de QR Code

Cada bilhete possui um QR code assinado com HMAC-SHA256:

**Payload:**
- `v`: versão (1)
- `tid`: ticket ID (UUID)
- `eid`: event ID (UUID)
- `n`: nonce único
- `iat`: timestamp de emissão

**Validação:**
1. Verifica assinatura HMAC
2. Verifica status do bilhete (deve ser ISSUED)
3. Verifica janela de validação (se configurada)
4. Aplica check-in baseado no modo (SINGLE/MULTI)
5. Transação atómica para evitar duplicados

## 📱 Validator Offline

### Fluxo Offline-First

1. **Pré-sync**: Antes do evento, validador faz GET `/api/validator/events/:id/sync`
   - Recebe lista de bilhetes válidos com tokens pré-assinados
   - Armazena localmente (IndexedDB)

2. **Scan Offline**: Durante o evento
   - Valida assinatura localmente
   - Marca check-in local
   - Guarda log em IndexedDB com flag "PENDING_SYNC"

3. **Sync Pós-evento**: POST `/api/validator/sync`
   - Envia batch de logs offline
   - Backend aplica check-ins de forma atómica
   - Resolve conflitos (primeiro check-in vence)

### Modo Online

POST `/api/validator/validate` - Validação imediata quando há rede

## 💳 Pagamentos

Camada abstrata `PaymentProvider` com implementações stub:

- **MBWay**: Gera referência MBWay
- **Multibanco**: Gera referência Multibanco (entity + reference)
- **PayPal**: URL de checkout PayPal

**Webhooks**: POST `/api/payments/webhook/:provider`

Em produção, integrar com APIs reais dos providers.

## 🔄 Transferência de Bilhetes

1. Dono inicia transferência: POST `/api/tickets/:id/transfer/initiate`
2. Sistema invalida ticket antigo (TRANSFERRED_OUT)
3. Cria novo ticket (TRANSFERRED_IN) para destinatário
4. Gera novo QR e PDF
5. Regista TransferLog para auditoria

## 📚 Endpoints Principais

### Público
- `GET /api/events` - Lista eventos publicados
- `GET /api/events/:slug` - Detalhes do evento
- `POST /api/checkout` - Criar pedido (com attendees nominais)

### Pagamentos
- `POST /api/payments/:provider/create` - Criar pagamento
- `POST /api/payments/webhook/:provider` - Webhook de confirmação

### Bilhetes
- `GET /api/me/tickets` - Bilhetes do utilizador
- `GET /api/tickets/:id/pdf` - Download PDF
- `POST /api/tickets/:id/transfer/initiate` - Iniciar transferência

### Validator
- `GET /api/validator/events` - Eventos atribuídos
- `GET /api/validator/events/:id/sync` - Sync para offline
- `POST /api/validator/validate` - Validação online
- `POST /api/validator/sync` - Sync logs offline

## 🧪 Testar

### Gerar código de bilhete para teste:

```bash
npm run test:ticket
```

Copia o token QR e testa no validator em `/validator`.

## 🔒 Segurança

- Passwords hasheadas com bcrypt
- QR codes assinados com HMAC-SHA256
- Validação de roles nas rotas protegidas
- Check-in atómico para evitar duplicados
- Webhooks verificados com signature

## 📝 Próximos Passos (Backlog)

- [ ] Integração real com providers de pagamento
- [ ] Envio de emails transacionais
- [ ] Dashboard de vendas para organizadores
- [ ] Exportação CSV
- [ ] Sistema de cupões/descontos
- [ ] Notificações push no validator
- [ ] Melhorias no UI/UX

## 📄 Licença

MVP de demonstração.

---

Desenvolvido para eventos em Portugal 🇵🇹#   d a o w a v e - b e t a 
 
 