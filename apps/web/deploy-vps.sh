#!/bin/bash
set -e

echo "🚀 Starting Deployment on VPS..."

# 1. Swap Setup (Prevent OOM)
if [ ! -f /swapfile ]; then
    echo "Creating 2GB Swap file..."
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "✅ Swap created."
fi

# 2. Update Code
echo "📥 Pulling latest code..."
git pull origin main

# 3. Clean Install
echo "🧹 Cleaning and Installing dependencies..."
cd apps/web
rm -rf node_modules
npm ci

# 4. Database Setup
echo "🗄️  Setting up Database..."
node scripts/fix-site.js

# 5. Build
echo "🏗️  Building Next.js App..."
npm run build

# 6. Restart PM2
echo "🔄 Restarting Application..."
pm2 restart ecosystem.production.config.js || pm2 start ecosystem.production.config.js

# 7. Cron runner (VPS — não Vercel)
chmod +x ../../scripts/cron-runner.sh 2>/dev/null || true

echo "✅ Deployment Complete!"
echo ""
echo "📌 Crons: este projeto NÃO usa Vercel Cron."
echo "   Configura crontab no servidor — ver infra/crontab.example"
echo "   Teste: CRON_SECRET=... APP_BASE_URL=http://127.0.0.1:3000 ../../scripts/cron-runner.sh release-holds"
