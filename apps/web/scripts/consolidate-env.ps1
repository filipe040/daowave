# Script para consolidar ficheiros .env
# Execute: .\scripts\consolidate-env.ps1

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   Consolidar Ficheiros .env                               " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$rootEnv = Join-Path $PSScriptRoot "..\..\.env"
$webEnv = Join-Path $PSScriptRoot "..\.env"

Write-Host "Ficheiros encontrados:" -ForegroundColor Yellow
Write-Host ""

if (Test-Path $rootEnv) {
    Write-Host "[OK] .env na raiz: $rootEnv" -ForegroundColor Green
    $rootContent = Get-Content $rootEnv -Raw
    $rootResend = if ($rootContent -match 'RESEND_API_KEY\s*=\s*(.+)') { 
        $matches[1].Trim().Trim('"', "'") 
    } else { 
        "nao encontrada" 
    }
    Write-Host "    RESEND_API_KEY: $($rootResend.Substring(0, [Math]::Min(30, $rootResend.Length)))... ($($rootResend.Length) chars)" -ForegroundColor Gray
} else {
    Write-Host "[X] .env na raiz: NAO encontrado" -ForegroundColor Red
}

Write-Host ""

if (Test-Path $webEnv) {
    Write-Host "[OK] .env em apps/web: $webEnv" -ForegroundColor Green
    $webContent = Get-Content $webEnv -Raw
    $webResend = if ($webContent -match 'RESEND_API_KEY\s*=\s*(.+)') { 
        $matches[1].Trim().Trim('"', "'") 
    } else { 
        "nao encontrada" 
    }
    Write-Host "    RESEND_API_KEY: $($webResend.Substring(0, [Math]::Min(30, $webResend.Length)))... ($($webResend.Length) chars)" -ForegroundColor Gray
} else {
    Write-Host "[X] .env em apps/web: NAO encontrado" -ForegroundColor Red
}

Write-Host ""
Write-Host ("-" * 60) -ForegroundColor Gray
Write-Host ""

Write-Host "RECOMENDACAO:" -ForegroundColor Cyan
Write-Host "   O Next.js carrega .env de apps/web (raiz do projeto Next.js)" -ForegroundColor White
Write-Host "   O .env na raiz do monorepo pode causar confusao" -ForegroundColor White
Write-Host ""
Write-Host "   [OK] Use apenas: apps/web/.env" -ForegroundColor Green
Write-Host "   [X] Remova ou renomeie: .env (raiz)" -ForegroundColor Yellow
Write-Host ""

$action = Read-Host "O que deseja fazer? (1=Manter apenas apps/web/.env, 2=Ver diferencas, 3=Cancelar)"

if ($action -eq "1") {
    Write-Host ""
    Write-Host "Renomeando .env da raiz para .env.backup..." -ForegroundColor Yellow
    
    if (Test-Path $rootEnv) {
        $backupPath = "$rootEnv.backup"
        if (Test-Path $backupPath) {
            $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
            $backupPath = "$rootEnv.backup.$timestamp"
        }
        Move-Item -Path $rootEnv -Destination $backupPath -Force
        Write-Host "[OK] .env da raiz renomeado para: $backupPath" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "[OK] Agora use apenas: apps/web/.env" -ForegroundColor Green
    Write-Host ""
    Write-Host "Proximos passos:" -ForegroundColor Cyan
    Write-Host "   1. Atualize apps/web/.env com a chave completa do Resend" -ForegroundColor White
    Write-Host "   2. Reinicie o servidor Next.js" -ForegroundColor White
    Write-Host "   3. Execute: node scripts/verify-resend-setup.js" -ForegroundColor White
    
} elseif ($action -eq "2") {
    Write-Host ""
    Write-Host "Comparando ficheiros..." -ForegroundColor Yellow
    
    if ((Test-Path $rootEnv) -and (Test-Path $webEnv)) {
        Write-Host ""
        Write-Host "Diferencas na RESEND_API_KEY:" -ForegroundColor Cyan
        Write-Host "   Raiz:    $rootResend" -ForegroundColor White
        Write-Host "   apps/web: $webResend" -ForegroundColor White
        
        if ($rootResend -eq $webResend) {
            Write-Host ""
            Write-Host "[!] As chaves sao iguais (ambas incompletas - 36 chars)" -ForegroundColor Yellow
            Write-Host "   Precisa atualizar apps/web/.env com a chave completa (~50 chars)" -ForegroundColor White
        }
    }
} else {
    Write-Host ""
    Write-Host "Operacao cancelada." -ForegroundColor Yellow
}

Write-Host ""
