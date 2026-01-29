#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/apps/web"

echo "Installing dependencies..."
npm ci

echo "Generating Prisma client..."
npx prisma generate --schema prisma/schema.prisma
echo "Applying safe DB patches (ensure expected columns/tables)..."
node ./scripts/ensure-schema.js

echo "Applying database migrations..."
npx prisma migrate deploy --schema prisma/schema.prisma

echo "Building Next.js app..."
rm -rf .next
npm run build

echo "Restarting application with PM2..."
pm2 startOrReload ../ecosystem.config.js --only daowave-web || pm2 startOrReload ecosystem.config.js --only daowave-web
pm2 save

echo "Done."

