#!/bin/bash
set -e

echo "🚀 Deploying to staging..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL is not set"
  exit 1
fi

# Navigate to web app
cd apps/web

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npm run db:generate

# Build
echo "🏗️  Building application..."
npm run build

# Run migrations
echo "🗄️  Running migrations..."
npm run db:migrate:deploy

# Seed staging data (optional, comment out if not needed)
echo "🌱 Seeding staging database..."
npm run db:seed:staging || echo "⚠️  Seed failed or already exists, continuing..."

echo "✅ Deploy completed!"

