# Plataforma de Bilhética - Implementação Limpa

Plataforma web completa para gestão e venda de bilhetes de eventos, com frontoffice público, área do utilizador e portal promotor.

## 🚀 Stack Tecnológica

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Next.js Route Handlers (REST API)
- **Database**: MariaDB/MySQL + Prisma ORM
- **Autenticação**: NextAuth.js (Credentials + JWT)
- **Pagamentos**: Provider abstrato com implementação Mock (pronto para Stripe/PSP PT)
- **QR Codes**: Assinatura HMAC para validação segura

## 📁 Estrutura do Projeto

```
apps/web/
├── app/                          # Next.js App Router
│   ├── (public)/                 # Rotas públicas
│   │   ├── home/                 # Homepage com lista de eventos
│   │   ├── events/[slug]/       # Detalhe do evento
│   │   ├── checkout/[orderId]/   # Checkout e pagamento
│   │   ├── my-tickets/           # Área do utilizador
│   │   └── ticket/[ticketId]/    # Detalhe do bilhete com QR
│   └── promotor/                  # Portal promotor
│       ├── login/                 # Login promotor
│       ├── page.tsx              # Dashboard
│       ├── events/               # CRUD eventos
│       └── checkin/[eventId]/    # Scanner QR
├── lib/                          # Bibliotecas e utilitários
│   ├── auth/                     # Configuração NextAuth
│   ├── payment/                  # Payment providers
│   ├── qr/                       # Geração e validação QR
│   ├── security/                 # Rate limiting, validação
│   └── utils.ts                  # Funções utilitárias
├── prisma/
│   ├── schema-clean.prisma       # Schema simplificado
│   └── seed-clean.ts             # Seed com dados exemplo
└── components/                   # Componentes React
    └── ui/                       # Componentes shadcn/ui
```

## 🗄️ Modelo de Dados

### Principais Entidades

- **User**: Utilizadores (USER, PROMOTER, ADMIN)
- **PromoterProfile**: Perfil do promotor
- **Event**: Eventos (DRAFT, PUBLISHED)
- **TicketLot**: Lotes de bilhetes com preços e stock
- **Order**: Pedidos de compra
- **Ticket**: Bilhetes emitidos com QR code assinado
- **AuditLog**: Log de auditoria

## 🔧 Setup Local

### Pré-requisitos

- Node.js 18+
- MariaDB instalado (sem XAMPP/Docker)
- npm ou yarn

### Instalação

1. **Instalar MariaDB**:
   - Download: https://mariadb.org/download/
   - Instalar o MSI do Windows
   - Anotar a password do root
   - Porta padrão: 3306

2. **Criar banco de dados**:

**Opção A - Script PowerShell (tenta encontrar MySQL automaticamente):**
```powershell
cd apps\web\prisma
.\run-database.ps1
```
> **Nota**: Se o root não tiver password, apenas pressione Enter quando pedir a password.

**Opção B - MySQL Workbench (mais fácil se instalado):**
1. Abrir MySQL Workbench
2. Conectar como root
3. File → Open SQL Script → `apps/web/prisma/database.sql`
4. Executar (⚡ ou Ctrl+Shift+Enter)

**Opção C - HeidiSQL:**
1. Abrir HeidiSQL
2. Conectar como root
3. File → Load SQL file → `apps/web/prisma/database.sql`
4. Executar (F9)

**Opção D - Copiar e Colar:**
1. Abrir `apps/web/prisma/database.sql`
2. Copiar todo o conteúdo
3. Colar no MySQL Workbench/HeidiSQL e executar

> **Nota**: Se o MySQL não estiver no PATH, use uma das opções B, C ou D acima.

O script cria automaticamente:
- Base de dados `ticketing`
- Utilizador `ticketing@localhost`
- Todas as tabelas, triggers, views e procedures

3. **Instalar dependências**:
```bash
cd apps/web
npm install
```

4. **Configurar variáveis de ambiente**:
Criar arquivo `.env`:
```env
# Database - MariaDB
DATABASE_URL="mysql://ticketing:ticketing_dev_password@localhost:3306/ticketing"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers (opcional - para login com Google/Apple)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
APPLE_ID="your-apple-service-id"
APPLE_SECRET="your-apple-secret-key"

# QR Code HMAC
QR_HMAC_SECRET="your-hmac-secret-key-here"

# Email - Resend (para verificação de email)
RESEND_API_KEY="re_your_resend_api_key"
EMAIL_FROM="noreply@seu-dominio.com"
APP_URL="http://localhost:3000"

# Payment Provider
PAYMENT_PROVIDER="mock"
```

5. **Executar migrations**:
```bash
# Gerar Prisma Client
npm run db:generate

# Executar migrations
npx prisma migrate dev --name init_clean
```

6. **Popular base de dados**:
```bash
npx tsx prisma/seed-clean.ts
```

7. **Configurar Resend (para verificação de email)**:

**Resend:**
1. Aceda ao [Resend Dashboard](https://resend.com/)
2. Crie uma conta ou faça login
3. Vá a "API Keys" → "Create API Key"
4. Copie a API Key (começa com `re_`)
5. Configure o domínio (Settings → Domains → Add Domain)
6. Adicione ao `.env` (sem aspas na API key):
   ```env
   RESEND_API_KEY=re_sua_api_key
   EMAIL_FROM="noreply@seu-dominio.com"
   APP_URL="http://localhost:3000"
   ```
   
   **Importante:** A API key NÃO deve ter aspas:
   ```env
   # ✅ Correto
   RESEND_API_KEY=re_abc123...
   
   # ❌ Errado
   RESEND_API_KEY="re_abc123..."
   ```

> **Nota**: Sem Resend configurado, os emails de verificação não serão enviados, mas a conta será criada.

8. **Configurar OAuth (opcional - para login com Google/Apple)**:

**Google:**
1. Aceda ao [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a API "Google+ API"
4. Vá a "Credenciais" → "Criar credenciais" → "ID do cliente OAuth"
5. Configure:
   - Tipo: Aplicação Web
   - URIs de redirecionamento autorizados: `http://localhost:3000/api/auth/callback/google`
6. Copie o Client ID e Client Secret para o `.env`

**Apple:**
1. Aceda ao [Apple Developer Portal](https://developer.apple.com/)
2. Crie um App ID e Service ID
3. Configure o Service ID com:
   - Domínios e subdomínios: `localhost` (dev) e seu domínio (prod)
   - URLs de retorno: `http://localhost:3000/api/auth/callback/apple`
4. Gere uma chave privada e copie o Key ID, Team ID e Service ID
5. Adicione ao `.env`:
   ```env
   APPLE_ID="your-service-id"
   APPLE_TEAM_ID="your-team-id"
   APPLE_KEY_ID="your-key-id"
   APPLE_SECRET="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
   ```
   > **Nota**: O `APPLE_SECRET` deve conter a chave privada completa com `\n` para quebras de linha.

> **Nota**: Se não configurar OAuth, os botões de Google/Apple não aparecerão na página de login.

8. **Iniciar servidor de desenvolvimento**:
```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`

## 📝 Credenciais de Teste

Após executar o seed:

- **Admin**: `admin@example.com` / `admin123`
- **Promotor**: `promoter@example.com` / `promoter123`
- **Utilizador**: `user@example.com` / `user123`

## 🛣️ Rotas Principais

### Frontoffice Público

- `GET /home` - Lista de eventos publicados
- `GET /events/[slug]` - Detalhe do evento
- `POST /api/checkout` - Criar pedido
- `POST /api/payments/confirm` - Confirmar pagamento
- `GET /my-tickets` - Bilhetes do utilizador
- `GET /ticket/[ticketId]` - Detalhe do bilhete com QR

### Portal Promotor

- `GET /promotor/login` - Login
- `GET /promotor` - Dashboard
- `GET /promotor/events` - Lista de eventos
- `GET /promotor/events/[id]` - Editar evento
- `POST /api/promotor/checkin/verify` - Verificar QR code

## 🔌 API Endpoints

### Eventos

- `GET /api/events` - Listar eventos publicados
  - Query params: `?city=Porto&search=rock`
- `GET /api/events/[slug]` - Detalhe do evento

### Checkout

- `POST /api/checkout` - Criar pedido
  ```json
  {
    "eventId": "uuid",
    "items": [
      { "ticketLotId": "uuid", "quantity": 2 }
    ]
  }
  ```

### Pagamentos

- `POST /api/payments/confirm` - Confirmar pagamento
  ```json
  {
    "orderId": "uuid",
    "paymentIntentId": "string"
  }
  ```

### Bilhetes

- `GET /api/tickets` - Listar bilhetes do utilizador
- `GET /api/tickets/[ticketId]` - Detalhe do bilhete

### Check-in

- `POST /api/promotor/checkin/verify` - Verificar QR code
  ```json
  {
    "qrCode": "base64-encoded-qr",
    "eventId": "uuid"
  }
  ```

## 🔐 Segurança

- **Passwords**: Hash com bcrypt
- **QR Codes**: Assinatura HMAC-SHA256
- **Validação**: Zod schemas
- **Rate Limiting**: Middleware simples para endpoints sensíveis
- **RBAC**: Roles USER, PROMOTER, ADMIN

## 💳 Sistema de Pagamentos

### Provider Abstrato

A plataforma usa um sistema de providers abstrato:

```typescript
interface IPaymentProvider {
  createIntent(params): Promise<PaymentIntent>;
  confirmPayment(ref): Promise<PaymentResult>;
  getStatus(ref): Promise<PaymentIntent>;
}
```

### Implementações

- **Mock**: Simulador para desenvolvimento (padrão)
- **Stripe**: (TODO - implementar)
- **PSP PT**: (TODO - implementar Multibanco/MB WAY)

## 📱 QR Codes

### Geração

Os QR codes são gerados com:
- Payload JSON (ticketId, code, exp opcional)
- Assinatura HMAC-SHA256
- Codificação Base64

### Validação

No check-in:
1. Decodificar Base64
2. Verificar assinatura HMAC
3. Verificar expiração (se presente)
4. Verificar ticket existe e não foi usado

## 🎨 UI/UX

- Design moderno e responsivo
- Tailwind CSS para estilização
- Componentes shadcn/ui
- UX otimizada para mobile

## 📦 Comandos Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build produção
npm run build

# Iniciar produção
npm start

# Prisma
npm run db:generate          # Gerar Prisma Client
npx prisma migrate dev       # Criar migration
npx prisma migrate deploy   # Aplicar migrations (produção)
npx prisma studio           # Abrir Prisma Studio

# Seed
npx tsx prisma/seed-clean.ts
```

## 🚧 Funcionalidades Implementadas

✅ Frontoffice público (lista eventos, detalhe, checkout)
✅ Área do utilizador (My Tickets, visualização QR)
✅ Portal promotor (dashboard, CRUD eventos, check-in)
✅ Sistema de pagamentos mock
✅ QR codes assinados com HMAC
✅ Autenticação NextAuth
✅ Validação de inputs (Zod)
✅ Rate limiting básico

## 🔮 Próximos Passos

- [ ] Integração Stripe
- [ ] Integração PSP PT (Multibanco/MB WAY)
- [ ] Upload de imagens para S3
- [ ] Export CSV de vendas
- [ ] Notificações por email
- [ ] Dashboard analytics avançado

## 📄 Licença

Este projeto é uma implementação limpa e estruturada de uma plataforma de bilhética.
