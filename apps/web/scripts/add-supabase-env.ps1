# Script PowerShell para adicionar variáveis Supabase ao .env
# Usage: .\scripts\add-supabase-env.ps1

$envFile = Join-Path $PSScriptRoot ".." ".env"

Write-Host "🔧 Adicionando variáveis Supabase ao .env..." -ForegroundColor Cyan
Write-Host ""

# Verificar se arquivo existe
if (-not (Test-Path $envFile)) {
    Write-Host "📝 Criando arquivo .env..." -ForegroundColor Yellow
    New-Item -Path $envFile -ItemType File -Force | Out-Null
}

# Ler conteúdo atual
$content = Get-Content $envFile -Raw -ErrorAction SilentlyContinue

# Variáveis para adicionar
$databaseUrl = 'DATABASE_URL="postgresql://postgres:f3lkwGTtPmQpgc6d@aws-1-eu-central-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1"'
$directUrl = 'DIRECT_URL="postgresql://postgres:f3lkwGTtPmQpgc6d@db.nuhpkhgimkadoowqdmsl.supabase.co:5432/postgres?sslmode=require"'

# Verificar se já existe DATABASE_URL
if ($content -match 'DATABASE_URL\s*=') {
    Write-Host "⚠️  DATABASE_URL já existe, atualizando..." -ForegroundColor Yellow
    $content = $content -replace 'DATABASE_URL\s*=.*', $databaseUrl
} else {
    Write-Host "✅ Adicionando DATABASE_URL..." -ForegroundColor Green
    if ($content -and -not $content.EndsWith("`n")) {
        $content += "`n"
    }
    $content += "# Database - Supabase`n"
    $content += "$databaseUrl`n"
}

# Verificar se já existe DIRECT_URL
if ($content -match 'DIRECT_URL\s*=') {
    Write-Host "⚠️  DIRECT_URL já existe, atualizando..." -ForegroundColor Yellow
    $content = $content -replace 'DIRECT_URL\s*=.*', $directUrl
} else {
    Write-Host "✅ Adicionando DIRECT_URL..." -ForegroundColor Green
    $content += "$directUrl`n"
}

# Escrever de volta
Set-Content -Path $envFile -Value $content -NoNewline

Write-Host ""
Write-Host "✅ Variáveis adicionadas com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. Testar conexões: npm run db:test:supabase"
Write-Host "   2. Aplicar migrations: npm run db:migrate:deploy"
Write-Host "   3. Seed (opcional): npm run db:seed:staging"
Write-Host ""

