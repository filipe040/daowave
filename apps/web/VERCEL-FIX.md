# Fix para Erros no Vercel

## Problema: Redis Connection Errors

O erro `ECONNREFUSED 127.0.0.1:6379` ocorre porque o código tenta conectar ao Redis durante o build.

## Solução Aplicada

1. **Redis completamente desabilitado**:
   - `lib/redis.ts` - Sempre retorna `null`
   - `lib/queue.ts` - Sempre retorna `null`
   - Nenhuma conexão Redis é criada

2. **Package.json**:
   - `bullmq` e `ioredis` movidos para `optionalDependencies`
   - Não são instalados automaticamente

3. **Next.js Config**:
   - `bullmq` e `ioredis` marcados como `serverExternalPackages`
   - Adicionados como aliases `false` no webpack para ignorar completamente
   - Evita bundling durante o build

4. **Prisma**:
   - Não tenta conectar durante build phase

## Variáveis de Ambiente no Vercel

**Obrigatórias:**
```env
DATABASE_URL="mysql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="https://seu-dominio.vercel.app"
QR_SECRET="..."
```

**Opcionais (Redis):**
```env
REDIS_URL="redis://..."  # Apenas se quiser usar Redis
```

## Build no Vercel

O build deve funcionar sem Redis. Se ainda houver erros:

### Erro: "Command npm run build exited with 1"

Este erro geralmente ocorre por:
1. **Variáveis de ambiente faltando** - Verifique se todas as variáveis obrigatórias estão configuradas
2. **Prisma Client não gerado** - O `prisma generate` pode falhar se `DATABASE_URL` não estiver definida
3. **Erros de TypeScript** - Verifique se há erros de compilação

**Solução:**
1. Configure as variáveis de ambiente no Vercel (mesmo que sejam valores dummy durante o build)
2. O Prisma Client será gerado, mas não tentará conectar durante o build
3. As páginas têm `export const dynamic = 'force-dynamic'`, então não serão renderizadas durante o build

### Outros erros:

1. **Remova as dependências Redis** (se ainda estiverem instaladas):
   ```bash
   npm uninstall bullmq ioredis
   ```

2. **Verifique variáveis de ambiente**:
   - `REDIS_URL` NÃO deve estar definida (ou deve estar vazia)
   - `DATABASE_URL` deve estar correta
   - `NEXTAUTH_SECRET` deve estar definida
   - `NEXTAUTH_URL` deve ser a URL do Vercel

3. **Limpe o cache do build**:
   - No Vercel: Settings → Build & Development Settings → Clear Build Cache
   - Ou adicione `.vercel` ao `.gitignore` e faça novo deploy

4. **Verifique os logs do build** no Vercel para ver exatamente onde está falhando

## Se Precisar de Redis (Opcional)

Se quiser usar Redis no futuro:
1. Configure `REDIS_URL` no Vercel
2. Use Upstash Redis (compatível com Vercel)
3. O código já está preparado para usar Redis quando `REDIS_URL` estiver definida
