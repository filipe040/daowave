# Row Level Security (RLS) Setup

## Resumo

Este documento explica a configuração de Row Level Security (RLS) no Supabase para resolver os avisos de segurança do Database Linter.

## Problema

O Supabase Database Linter estava a reportar que todas as tabelas públicas não tinham RLS habilitado, o que representa um risco de segurança se as tabelas forem acessíveis via PostgREST (API REST do Supabase).

## Solução Implementada

### 1. RLS Habilitado em Todas as Tabelas

Foi criado um script (`scripts/enable-rls.js`) que:
- Habilita RLS em todas as tabelas do schema `public`
- Cria políticas que bloqueiam todo o acesso público via PostgREST
- Mantém o acesso via Prisma Client funcionando normalmente

### 2. Tabelas Protegidas

As seguintes tabelas têm RLS habilitado:
- `User`
- `OrganizerProfile`
- `Event`
- `TicketType`
- `TicketLot`
- `Order`
- `OrderItem`
- `Ticket`
- `TransferLog`
- `ValidatorAssignment`
- `CheckinLog`
- `Coupon`
- `EmailLog`
- `BetaAllowlist`
- `AuditLog`
- `_prisma_migrations`

### 3. Políticas de Segurança

Todas as tabelas têm uma política chamada `"Deny all public access"` que:
- Bloqueia **todos** os acessos via PostgREST (API REST pública)
- **Não afeta** o Prisma Client, que usa credenciais de service role e bypassa RLS

## Como Funciona

### Prisma Client (Funciona Normalmente)
- O Prisma Client usa a `DATABASE_URL` que contém credenciais de service role
- Service role credentials têm `BYPASSRLS` e podem aceder todas as tabelas
- **Nenhuma alteração necessária no código da aplicação**

### PostgREST (Bloqueado)
- Tentativas de acesso via API REST pública são bloqueadas
- Protege contra acesso não autorizado às tabelas
- Se precisar de acesso via PostgREST no futuro, pode criar políticas específicas

## Scripts Disponíveis

### Habilitar RLS em Todas as Tabelas
```bash
node scripts/enable-rls.js
```

### Habilitar RLS na Tabela _prisma_migrations
```bash
node scripts/enable-rls-prisma-migrations.js
```

## Migração SQL

Também foi criada uma migração SQL em:
```
prisma/migrations/enable_rls/migration.sql
```

Esta migração pode ser aplicada manualmente se necessário.

## Verificação

Após executar os scripts, verifique no Supabase Dashboard:
1. Vá para **Database** > **Linter**
2. Os avisos de "RLS Disabled in Public" devem desaparecer
3. Todas as tabelas devem mostrar RLS como habilitado

## Notas Importantes

1. **Prisma Client não é afetado**: O Prisma Client continua a funcionar normalmente porque usa service role credentials
2. **PostgREST bloqueado**: Acesso via API REST pública está bloqueado (segurança)
3. **Sem impacto na aplicação**: Nenhuma alteração necessária no código existente
4. **Reversível**: Se precisar desabilitar RLS, pode executar `ALTER TABLE ... DISABLE ROW LEVEL SECURITY`

## Próximos Passos (Opcional)

Se no futuro precisar de acesso via PostgREST para funcionalidades específicas, pode criar políticas mais granulares:

```sql
-- Exemplo: Permitir leitura pública de eventos publicados
CREATE POLICY "Public events are viewable" ON "Event"
  FOR SELECT USING (status = 'PUBLISHED');
```

Mas para a maioria dos casos, as políticas atuais (bloqueio total) são suficientes e mais seguras.
