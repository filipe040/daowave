#!/usr/bin/env bash
# Repara VPS: DB + build + nginx + pm2. Correr na VPS: bash scripts/vps-fix.sh
set -euo pipefail

ROOT="/var/www/daowave"
WEB="$ROOT/apps/web"

echo "=== 1. Parar processos na porta 3000 ==="
pm2 delete all 2>/dev/null || true
sudo fuser -k 3000/tcp 2>/dev/null || true
sleep 2

echo "=== 2. Verificar .env e MariaDB ==="
if [[ ! -f "$WEB/.env" ]]; then
  echo "ERRO: Falta $WEB/.env"
  exit 1
fi
cd "$WEB"
set -a
source .env 2>/dev/null || true
set +a

grep -q '^DATABASE_URL=' .env || { echo "ERRO: DATABASE_URL em falta no .env"; exit 1; }

echo "=== 3. Sincronizar schema (fontFamily, etc.) ==="
npx prisma db push --accept-data-loss
npx prisma generate

echo "=== 4. Build Next.js ==="
cd "$ROOT"
npm run build

echo "=== 5. Nginx ==="
sudo tee /etc/nginx/sites-available/daowave > /dev/null <<'NGINX'
server {
    listen 80;
    server_name daowave.pt www.daowave.pt tickets.daowave.pt;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_read_timeout 60s;
    }
}
NGINX
sudo ln -sf /etc/nginx/sites-available/daowave /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

echo "=== 6. PM2 ==="
cd "$WEB"
pm2 delete daowave 2>/dev/null || true
if [[ -f ecosystem.config.cjs ]]; then
  pm2 start ecosystem.config.cjs
else
  pm2 start npm --name daowave --cwd "$WEB" -- start
fi
pm2 save

sleep 6
echo "=== 7. Testes ==="
curl -sI http://127.0.0.1:3000 | head -5
curl -sI http://127.0.0.1:80 -H "Host: daowave.pt" | head -5
pm2 status

echo ""
echo "Se 127.0.0.1:3000 = 200, no Cloudflare: SSL/TLS -> Flexible"
echo "Depois testa: curl -I http://daowave.pt"
