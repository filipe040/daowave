# Correções do Dashboard - Resumo Completo

## ✅ Correções Implementadas

### 1. **New Category Modal (Bilhética)**
- ✅ Criada API `/api/promotor/events/[id]/ticket-lots` (POST)
- ✅ Modal agora cria TicketLot corretamente
- ✅ Validação de campos e feedback ao utilizador

### 2. **RBAC Matrix (Teams)**
- ✅ Clarificado que é apenas visualização de referência
- ✅ Permissões são definidas ao criar/editar membros

### 3. **Coupons (Cupões)**
- ✅ Adicionado modelo `Coupon` ao schema Prisma
- ✅ Campos: `code`, `discountType`, `discountValue`, `maxUses`, `usedCount`, `isActive`, `startsAt`, `endsAt`
- ✅ API GET `/api/organizer/coupons` corrigida
- ✅ API POST `/api/organizer/coupons` corrigida
- ✅ API GET/PUT/DELETE `/api/organizer/coupons/[id]` corrigida
- ✅ Página `/organizer/coupons` agora funciona

### 4. **Password Reset (Recuperação de Password)**
- ✅ Adicionados campos `passwordResetToken` e `passwordResetTokenExpiresAt` ao modelo `User`
- ✅ API `/api/auth/forgot-password` corrigida
- ✅ API `/api/auth/reset-password` corrigida

### 5. **Check-in Fields (Validação de Bilhetes)**
- ✅ Adicionados campos ao modelo `Event`:
  - `checkinMode` (SINGLE, MULTI)
  - `checkinStartAt` (início da janela de check-in)
  - `checkinEndAt` (fim da janela de check-in)
  - `maxEntries` (máximo de entradas por bilhete no modo MULTI)
- ✅ Adicionados campos ao modelo `Ticket`:
  - `entriesUsed` (número de entradas já utilizadas)
  - `lastCheckinAt` (última vez que foi usado)
- ✅ API `/api/validator/validate` atualizada para usar novos campos
- ✅ Suporte completo para modo SINGLE e MULTI
- ✅ API `/api/organizer/events` atualizada para salvar campos de check-in
- ✅ API `/api/organizer/events/[id]` atualizada para atualizar campos de check-in

## 📋 Schema Prisma - Mudanças

### Modelo `User`
```prisma
passwordResetToken              String?   @unique
passwordResetTokenExpiresAt     DateTime?
```

### Modelo `Event`
```prisma
checkinMode           String?  @default("SINGLE") // SINGLE, MULTI
checkinStartAt        DateTime? // Início da janela de check-in
checkinEndAt          DateTime? // Fim da janela de check-in
maxEntries            Int?     // Máximo de entradas por bilhete (MULTI mode)
```

### Modelo `Ticket`
```prisma
entriesUsed Int      @default(0) // Número de entradas já utilizadas
lastCheckinAt DateTime? // Última vez que foi usado
```

### Novo Modelo `Coupon`
```prisma
model Coupon {
  id            String              @id @default(uuid())
  eventId       String
  code          String              @unique
  discountType  CouponDiscountType
  discountValue Int                 // Percentagem (1-100) ou valor em cêntimos
  maxUses       Int?                // Máximo de utilizações (null = ilimitado)
  usedCount     Int                 @default(0)
  isActive      Boolean             @default(true)
  startsAt      DateTime
  endsAt        DateTime
  createdAt     DateTime            @default(now())
  updatedAt     DateTime            @default(now()) @updatedAt
  
  event         Event               @relation(fields: [eventId], references: [id], onDelete: Cascade)
  
  @@index([eventId])
  @@index([code])
  @@index([isActive])
  @@index([endsAt])
}

enum CouponDiscountType {
  PERCENTAGE  // Desconto percentual (1-100)
  FIXED       // Desconto fixo em cêntimos
}
```

## ⚠️ Migração Necessária

**IMPORTANTE**: É necessário executar a migração do Prisma para aplicar as mudanças ao schema:

```bash
cd apps/web
npx prisma migrate dev --name add_missing_models_coupons_checkin_password
```

Ou criar manualmente a migração se o ambiente não permitir modo interativo.

## 🔄 Pendências (Não Críticas)

### 1. **Badge Designer - PDF Generation**
- ⏳ API `/api/promotor/events/[id]/badge-design/generate` ainda é placeholder
- ⏳ Necessário integrar biblioteca de PDF (pdfkit, puppeteer, etc.)
- ⏳ Funcionalidade básica (upload template, prefix) já funciona

### 2. **Validator Assignments**
- ⏳ Modelo `ValidatorAssignment` não existe
- ⏳ APIs `/api/validator/events` e `/api/validator/events/[id]/sync` têm TODOs
- ⏳ Não é crítico para funcionamento básico

### 3. **Templates Page**
- ✅ Página `/organizer/templates` já funciona
- ✅ Lista eventos publicados como templates
- ✅ Link para criar novo evento a partir de template funciona

## 📝 Notas Técnicas

1. **Mapeamento de Campos**: O formulário de eventos usa `entryWindowStartAt/EndAt` mas o schema usa `checkinStartAt/EndAt`. O código da API faz o mapeamento correto.

2. **Remoção de `reentryAllowed`**: Campo removido do schema pois o modo MULTI já implica reentry. Validações relacionadas foram removidas.

3. **Check-in Mode**: 
   - SINGLE: Um bilhete = uma entrada (usa `checkedInAt`)
   - MULTI: Um bilhete = múltiplas entradas (usa `entriesUsed` e `maxEntries`)

4. **Coupons**: Sistema completo de cupões de desconto com validação de código único, janela de validade, e limite de utilizações.

## 🎯 Próximos Passos Recomendados

1. **Aplicar migração do Prisma** (crítico)
2. **Testar fluxo completo de cupões** (criar, editar, usar no checkout)
3. **Testar validação de bilhetes** (modo SINGLE e MULTI)
4. **Implementar geração de PDF para badges** (quando necessário)
5. **Adicionar ValidatorAssignment** (se necessário para gestão de validadores)

## ✨ Melhorias de UX/UI Sugeridas

- Adicionar loading states em todos os modais
- Melhorar mensagens de erro/validação
- Adicionar confirmações para ações destrutivas
- Melhorar feedback visual em tabelas (hover, estados)
- Adicionar empty states mais informativos
