# Escalabilidade LivePass — Infraestrutura para Alto Tráfego

Guia para aguentar **muitas compras em simultâneo** e **milhares de utilizadores** na plataforma.

---

## Arquitetura recomendada (produção)

```
                    ┌─────────────┐
   Utilizadores ──► │   Cloudflare │  CDN + DDoS + cache estático
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │    Nginx     │  Load balancer + SSL + rate limit
                    └──────┬──────┘
              ┌────────────┼────────────┐
              ▼            ▼            ▼
         Next.js:3000  :3001       :3002   (PM2 / múltiplas instâncias)
              └────────────┼────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
         MariaDB/MySQL   Redis       MinIO/S3
         (InnoDB)     (cache/filas)  (assets)
```

---

## O que já está implementado no código

| Mecanismo | Descrição |
|-----------|-----------|
| **Reservas de stock (holds)** | 10 min de bloqueio antes do pagamento — evita overselling |
| **Row locking (`FOR UPDATE`)** | Bloqueio pessimista nos lotes/lugares durante checkout |
| **Transações Serializable** | Inventário consistente mesmo com compras paralelas |
| **Rate limiting** | Checkout, auth, check-in — Redis se `REDIS_URL` definido, senão memória |
| **Idempotência pagamentos** | Chaves únicas no ledger financeiro |
| **Cron liberta holds** | `/api/cron/release-holds` devolve stock de reservas expiradas |
| **Health check** | `/api/health` — DB + Redis |

---

## 1. Base de dados (MySQL/MariaDB)

### Connection pool (obrigatório em produção)

No `.env`:

```env
DATABASE_URL="mysql://user:pass@127.0.0.1:3306/ticketing?connection_limit=20&pool_timeout=20"
```

Regra: `connection_limit × número_instâncias_PM2 ≤ max_connections` do MySQL (default 151).

### Tuning MySQL (VPS 4–8 GB RAM)

```ini
# /etc/mysql/mariadb.conf.d/99-livepass.cnf
[mysqld]
innodb_buffer_pool_size = 2G
innodb_log_file_size = 256M
max_connections = 200
thread_cache_size = 50
query_cache_type = 0
slow_query_log = 1
long_query_time = 1
```

### Índices

Migration `20260610130000_inventory_hold_index` — índice composto em holds para agregações rápidas sob carga de checkout.

### Backups

- Dump diário automatizado (`mysqldump` + retenção 7 dias)
- Testar restore mensalmente

---

## 2. Redis (recomendado para multi-instância)

Sem Redis, o rate limit é **in-memory por processo** — com 2+ instâncias PM2 cada uma tem contadores separados.

```env
REDIS_URL=redis://127.0.0.1:6379
# ou Upstash: rediss://default:password@host:6379
```

**Usos:**
- Rate limiting partilhado entre instâncias
- Filas BullMQ (emails, PDFs) — `lib/queue/email.queue.ts`
- Cache de sessões/eventos (futuro)

Local com Docker:

```bash
docker compose up -d redis
```

---

## 3. Aplicação Next.js (VPS)

### PM2 — instância única (atual)

Ficheiro: `ecosystem.production.config.js`

```bash
pm2 start ecosystem.production.config.js
pm2 save
```

### PM2 — múltiplas instâncias (escala horizontal)

1. Duplicar app em portas 3000, 3001, 3002 (variável `PORT`)
2. Nginx upstream round-robin (ver `infra/nginx/livepass.conf.example`)
3. **Obrigatório:** Redis para rate limit coerente

Memória: `--max-old-space-size=2048` por instância; monitorizar com `pm2 monit`.

### Variáveis críticas

```env
NODE_ENV=production
DATABASE_URL=mysql://...?connection_limit=20
REDIS_URL=redis://...
NEXTAUTH_SECRET=...
CRON_SECRET=...          # protege jobs cron
RESEND_API_KEY=...       # emails assíncronos
```

---

## 4. Nginx (reverse proxy)

Ver exemplo: `infra/nginx/livepass.conf.example`

Pontos-chave:
- `proxy_read_timeout 60s` — checkout/pagamento
- `limit_req` — camada extra de proteção
- Cache de `/_next/static` e imagens
- Gzip/brotli activo

---

## 5. Cloudflare (recomendado)

- **Proxy laranja** no domínio — esconde IP da VPS
- Cache agressivo em assets estáticos
- WAF + rate limiting na edge
- Page Rules: `/api/checkout/*` → **Bypass cache**

---

## 6. Fluxo de checkout sob carga

1. Cliente selecciona bilhetes → `POST /api/checkout/hold` (lock + reserva)
2. Cria encomenda → `POST /api/checkout/create`
3. Pagamento (Eupago/Stripe) → webhook ou confirm
4. Emissão bilhetes + email (assíncrono se Redis activo)

**Picos de venda (on-sale):**
- Pré-aquecer cache CDN da página do evento
- Aumentar instâncias PM2 30 min antes
- Monitorizar `/api/health` e slow queries MySQL
- Cron `release-holds` a cada 1–2 min durante pico

---

## 7. Crons necessários

| Endpoint | Frequência | Função |
|----------|------------|--------|
| `/api/cron/release-holds` | 1–5 min | Libertar reservas expiradas |
| `/api/cron/email-schedulers` | 15 min | Lembretes, alertas bilhetes |
| `/api/cron/finance/release-balances` | Diário | Finanças promotor |
| `/api/cron/ticket-alerts` | 5 min | Pré-registo → email |

Todos requerem header: `Authorization: Bearer $CRON_SECRET`

Exemplo crontab:

```cron
*/2 * * * * curl -s -H "Authorization: Bearer $CRON_SECRET" https://livepass.pt/api/cron/release-holds
*/5 * * * * curl -s -H "Authorization: Bearer $CRON_SECRET" https://livepass.pt/api/cron/ticket-alerts
```

---

## 8. Monitorização

- **Health:** `GET /api/health` — integrar UptimeRobot / Better Stack
- **PM2:** `pm2 logs`, `pm2 monit`
- **MySQL:** slow query log, `SHOW PROCESSLIST` durante picos
- **Sentry** (opcional): erros 5xx em checkout

---

## 9. Capacidade estimada (referência)

| Setup | Compras simultâneas* | Utilizadores navegando |
|-------|---------------------|------------------------|
| 1× VPS 2 vCPU, 4 GB, PM2×1 | ~50–100 holds/min | ~500 concurrent |
| 1× VPS 4 vCPU, 8 GB, PM2×2 + Redis | ~200–400 holds/min | ~2000 concurrent |
| 2× VPS + LB + Redis + Cloudflare | ~1000+ holds/min | 10k+ concurrent |

\*Depende do tempo de pagamento e complexidade por encomenda.

---

## 10. Checklist antes de evento grande

- [ ] `npx prisma migrate deploy` em produção
- [ ] Redis activo e health OK
- [ ] Connection pool configurado
- [ ] Crons activos (holds + ticket-alerts)
- [ ] Teste de carga manual (10+ tabs a comprar o mesmo lote — só 1 deve passar)
- [ ] Backup DB recente
- [ ] Cloudflare / Nginx cache verificado

---

## Migrações desta optimização

```bash
cd apps/web
npx prisma migrate deploy
```

- `20260610130000_inventory_hold_index` — índice holds
