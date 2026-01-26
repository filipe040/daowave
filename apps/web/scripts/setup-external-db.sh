#!/bin/bash
set -e

echo "🚀 Configurando base de dados externa..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL não está definido"
  echo ""
  echo "💡 Configure DATABASE_URL com a connection string da sua base de dados externa:"
  echo "   export DATABASE_URL='postgresql://user:password@host:5432/database'"
  echo ""
  echo "   Ou adicione ao arquivo .env:"
  echo "   DATABASE_URL=postgresql://user:password@host:5432/database"
  exit 1
fi

echo "✅ DATABASE_URL configurado"
echo ""

# Check connection
echo "🔍 Verificando conexão..."
node scripts/check-external-db.js

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Falha na verificação de conexão"
  echo "💡 Verifique se:"
  echo "   - DATABASE_URL está correto"
  echo "   - O servidor está acessível"
  echo "   - O seu IP está na whitelist (se aplicável)"
  exit 1
fi

echo ""
echo "📦 Aplicando migrations..."
npm run db:migrate:deploy

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Falha ao aplicar migrations"
  exit 1
fi

echo ""
echo "🌱 Executando seed (staging)..."
npm run db:seed:staging

echo ""
echo "✅ Configuração concluída!"
echo ""
echo "💡 Próximos passos:"
echo "   - Verificar dados: node scripts/check-external-db.js"
echo "   - Abrir Prisma Studio: npx prisma studio"

