# Script PowerShell para atualizar a RESEND_API_KEY no .env
# Execute: .\scripts\update-resend-key.ps1

Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Atualizar RESEND_API_KEY no .env                        ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$envPath = Join-Path $PSScriptRoot "..\.env"

if (-not (Test-Path $envPath)) {
    Write-Host "❌ Ficheiro .env não encontrado em: $envPath" -ForegroundColor Red
    exit 1
}

Write-Host "📁 Ficheiro: $envPath" -ForegroundColor Yellow
Write-Host ""

# Mostrar valor atual
$currentContent = Get-Content $envPath -Raw
$currentMatch = [regex]::Match($currentContent, 'RESEND_API_KEY\s*=\s*(.+)')
if ($currentMatch.Success) {
    $currentKey = $currentMatch.Groups[1].Value.Trim().Trim('"', "'")
    Write-Host "🔑 Chave atual:" -ForegroundColor Yellow
    Write-Host "   $currentKey" -ForegroundColor White
    Write-Host "   Comprimento: $($currentKey.Length) caracteres" -ForegroundColor White
    Write-Host ""
}

# Pedir nova chave
Write-Host "Por favor, cole a NOVA API key do Resend:" -ForegroundColor Cyan
Write-Host "(Deve começar com 're_' e ter ~50 caracteres)" -ForegroundColor Gray
$newKey = Read-Host "Nova RESEND_API_KEY"

if ([string]::IsNullOrWhiteSpace($newKey)) {
    Write-Host "❌ Chave vazia. Operação cancelada." -ForegroundColor Red
    exit 1
}

# Limpar a chave
$newKey = $newKey.Trim().Trim('"', "'")

Write-Host ""
Write-Host "🔑 Nova chave:" -ForegroundColor Green
Write-Host "   $newKey" -ForegroundColor White
Write-Host "   Comprimento: $($newKey.Length) caracteres" -ForegroundColor White
Write-Host ""

# Validar
if (-not $newKey.StartsWith('re_')) {
    Write-Host "⚠️  AVISO: A chave não começa com 're_'" -ForegroundColor Yellow
    $confirm = Read-Host "Continuar mesmo assim? (s/N)"
    if ($confirm -ne 's' -and $confirm -ne 'S') {
        Write-Host "Operação cancelada." -ForegroundColor Red
        exit 1
    }
}

if ($newKey.Length -lt 45) {
    Write-Host "⚠️  AVISO: A chave tem apenas $($newKey.Length) caracteres (esperado ~50)" -ForegroundColor Yellow
    $confirm = Read-Host "A chave pode estar incompleta. Continuar? (s/N)"
    if ($confirm -ne 's' -and $confirm -ne 'S') {
        Write-Host "Operação cancelada." -ForegroundColor Red
        exit 1
    }
}

# Atualizar ficheiro
$content = Get-Content $envPath -Raw
$newContent = [regex]::Replace($content, 'RESEND_API_KEY\s*=.*', "RESEND_API_KEY=$newKey")

Set-Content -Path $envPath -Value $newContent -NoNewline

Write-Host ""
Write-Host "✅ Ficheiro .env atualizado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. Reinicie o servidor Next.js (Ctrl+C e depois npm run dev)" -ForegroundColor White
Write-Host "   2. Execute: node scripts/verify-resend-setup.js" -ForegroundColor White
Write-Host "   3. Verifique se a chave está a ser lida corretamente" -ForegroundColor White
