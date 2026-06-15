#!/usr/bin/env bash
# Recuperação P3018/P3018 na migration 20260615120000_member_roles_refactor
# Causa: MySQL rejeita UPDATE para valores ENUM ainda não declarados (error 1265).
#
# Uso (na VPS, com DATABASE_URL apontando para produção):
#   cd apps/web
#   bash ../../scripts/migrate-recover-member-roles.sh
#
set -euo pipefail

cd "$(dirname "$0")/../apps/web"

echo "==> Marcar migration falhada como rolled-back..."
npx prisma migrate resolve --rolled-back 20260615120000_member_roles_refactor

echo "==> Aplicar migrations (ficheiro SQL corrigido)..."
npx prisma migrate deploy

echo "==> Concluído."
