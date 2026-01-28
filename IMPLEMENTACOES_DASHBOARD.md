# Implementações do Dashboard - Resumo Completo

## ✅ Funcionalidades Implementadas

### 1. **Definições do Evento** ✅
- **Página**: `/promotor/events/[id]/settings`
- **Componente**: `event-settings-content.tsx` (Client Component)
- **API**: `PATCH /api/promotor/events/[id]/settings`
- **Funcionalidades**:
  - Editar: title, slug, description, venue, city, startAt, endAt, coverImage
  - Validação completa (Zod schema)
  - Autorização: só promotor do evento ou ADMIN
  - Toast de sucesso/erro
  - Auto-refresh após guardar
- **Integração**: Botão "DEFINIÇÕES" no card do evento agora é um Link funcional

### 2. **Arquivar / Re-publicar Evento** ✅
- **Campo Prisma**: `archivedAt DateTime?` adicionado ao modelo `Event`
- **API**: `POST /api/promotor/events/[id]/archive`
- **Funcionalidades**:
  - Arquivar apenas eventos PUBLISHED
  - Re-publicar eventos arquivados
  - Botão dinâmico: "ARQUIVAR" vs "RE-PUBLICAR"
  - Confirmação antes de arquivar
- **Filtros Públicos**: Todas as queries públicas agora filtram `archivedAt: null`:
  - `/app/api/events` (GET)
  - `/app/api/events/[slug]` (GET)
  - `/app/page.tsx` (homepage)
  - `/app/events/page.tsx`
  - `/app/events/[slug]/page.tsx`
  - `/app/home/page.tsx`

### 3. **Breadcrumbs Reutilizáveis** ✅
- **Componente**: `/app/components/breadcrumbs.tsx`
- **Estilo**: Compacto, inspirado em LiveGrid (ESTÚDIO > BILHÉTICA & RECEITA)
- **Aplicado em**:
  - Dashboard do evento (`event-dashboard-content.tsx`)
  - Bilhética (`ticketing-center-content.tsx`)
  - Branding (`branding-content.tsx`)
  - Equipas (`teams-content.tsx`)
  - Definições (`event-settings-content.tsx`)
  - Assets (`assets-content.tsx`)

### 4. **Biblioteca de Assets** ✅
- **Modelo Prisma**: `EventAsset` criado com campos:
  - `id`, `eventId`, `filename`, `url`, `mimeType`, `size`, `createdAt`
- **Página**: `/promotor/events/[id]/assets`
- **Componente**: `assets-content.tsx` (Client Component)
- **APIs**:
  - `GET /api/promotor/events/[id]/assets` (via page.tsx Server Component)
  - `POST /api/promotor/events/[id]/assets/upload` (upload de ficheiros)
  - `DELETE /api/promotor/events/[id]/assets/[assetId]` (eliminar asset)
- **Funcionalidades**:
  - Upload de imagens (PNG, JPG, WEBP até 10MB)
  - Grid de preview com hover effects
  - Informações: nome, tamanho, data
  - Eliminar com confirmação
  - Empty state quando não há assets
  - Storage: `/public/uploads/events/<eventId>/...`
  - Segurança: validação MIME/size, autorização (promotor/admin)
- **Integração**: Card "BIBLIOTECA ASSETS" no dashboard agora é Link funcional

### 5. **Sidebar Footer com Role** ✅
- **Promotor Sidebar**: Adicionado role abaixo do email
- **Organizer Sidebar**: Adicionado role acima do email
- **Formato**: Uppercase, tracking-wider (ex: "ADMIN", "PROMOTER", "USER")

## 📋 Schema Prisma - Mudanças

### Modelo `Event`
```prisma
archivedAt  DateTime?    // Data de arquivamento (null = não arquivado)
```

### Novo Modelo `EventAsset`
```prisma
model EventAsset {
  id          String   @id @default(uuid())
  eventId     String
  filename    String
  url         String   // URL pública do asset
  mimeType    String   // image/png, image/jpeg, etc.
  size        Int      // Tamanho em bytes
  createdAt   DateTime @default(now())
  
  event       Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  
  @@index([eventId])
  @@index([createdAt])
}
```

## ⚠️ Migração Necessária

**IMPORTANTE**: É necessário executar a migração do Prisma para aplicar as mudanças:

```bash
cd apps/web
npx prisma migrate dev --name add_event_settings_archive_assets
```

Ou em produção:
```bash
npx prisma migrate deploy
```

## 📁 Ficheiros Criados/Modificados

### Novos Ficheiros
- `app/components/breadcrumbs.tsx`
- `app/promotor/events/[id]/settings/page.tsx`
- `app/promotor/events/[id]/settings/components/event-settings-content.tsx`
- `app/promotor/events/[id]/assets/page.tsx`
- `app/promotor/events/[id]/assets/components/assets-content.tsx`
- `app/api/promotor/events/[id]/settings/route.ts`
- `app/api/promotor/events/[id]/archive/route.ts`
- `app/api/promotor/events/[id]/assets/upload/route.ts`
- `app/api/promotor/events/[id]/assets/[assetId]/route.ts`

### Ficheiros Modificados
- `prisma/schema.prisma` (campo `archivedAt` + modelo `EventAsset`)
- `app/promotor/events/[id]/components/event-dashboard-content.tsx` (botões Definições/Arquivar + breadcrumbs + link Assets)
- `app/promotor/events/[id]/tickets/components/ticketing-center-content.tsx` (breadcrumbs)
- `app/promotor/events/[id]/branding/components/branding-content.tsx` (breadcrumbs)
- `app/promotor/events/[id]/teams/components/teams-content.tsx` (breadcrumbs)
- `app/promotor/components/promoter-sidebar.tsx` (role no footer)
- `app/organizer/components/sidebar.tsx` (role no footer)
- `app/api/events/route.ts` (filtro `archivedAt: null`)
- `app/api/events/[slug]/route.ts` (filtro `archivedAt: null`)
- `app/page.tsx` (filtro `archivedAt: null`)
- `app/events/page.tsx` (filtro `archivedAt: null`)
- `app/events/[slug]/page.tsx` (filtro `archivedAt: null` + select `archivedAt`)
- `app/home/page.tsx` (filtro `archivedAt: null`)
- `app/promotor/events/[id]/page.tsx` (select `archivedAt`)

## 🎨 UX/UI

- **Breadcrumbs**: Compactos, clicáveis, estilo LiveGrid
- **Toasts**: Notificações de sucesso/erro (auto-dismiss após 5s)
- **Loading States**: Botões mostram "A guardar...", "A carregar..." durante operações
- **Empty States**: Mensagens informativas quando não há dados (assets, etc.)
- **Confirmações**: Dialogs antes de ações destrutivas (arquivar, eliminar asset)
- **Validação**: Feedback claro de erros (tamanho de ficheiro, tipo, etc.)

## 🔒 Segurança

- **Autorização**: Todas as APIs verificam role (PROMOTER/ADMIN) e ownership do evento
- **Validação de Ficheiros**: MIME types permitidos, tamanho máximo (10MB)
- **Sanitização**: Nomes de ficheiros sanitizados antes de guardar
- **Fallbacks**: Tratamento de erros quando tabelas/colunas não existem (migration não aplicada)

## ✨ Próximos Passos (Opcional)

1. **Integração Assets → Branding**: Permitir selecionar assets da biblioteca como logo/banner no editor de branding
2. **Preview de Assets**: Modal com preview maior ao clicar no asset
3. **Bulk Upload**: Upload múltiplo de assets de uma vez
4. **Categorização**: Tags/categorias para organizar assets
5. **Uso de Assets**: Mostrar onde cada asset está a ser usado (branding, landing page, etc.)

## 🚀 Build Status

- ✅ Sem erros de lint
- ✅ TypeScript compila sem erros
- ✅ Fallbacks para migration não aplicada
- ⚠️ **Requer migração Prisma** para funcionalidade completa
