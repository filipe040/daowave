# Script PowerShell para adicionar campos de verificacao de email
# Execute este script se ja tiver uma base de dados criada

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Adicionar Campos de Verificacao de Email" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Procurar mysql.exe
$mysqlExe = $null
$commonPaths = @(
    "C:\Program Files\MariaDB\*\bin\mysql.exe",
    "C:\Program Files\MySQL\*\bin\mysql.exe",
    "C:\xampp\mysql\bin\mysql.exe",
    "C:\wamp\bin\mysql\*\bin\mysql.exe"
)

foreach ($path in $commonPaths) {
    $found = Get-ChildItem -Path $path -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) {
        $mysqlExe = $found.FullName
        break
    }
}

if (-not $mysqlExe) {
    Write-Host "mysql.exe nao encontrado nos caminhos comuns." -ForegroundColor Red
    $manualPath = Read-Host "Por favor, insira o caminho completo para mysql.exe"
    if (Test-Path $manualPath) {
        $mysqlExe = $manualPath
    } else {
        Write-Host "Caminho invalido. A sair..." -ForegroundColor Red
        exit 1
    }
}

Write-Host "mysql.exe encontrado: $mysqlExe" -ForegroundColor Green
Write-Host ""

# Pedir password do root
$securePassword = Read-Host "Insira a password do utilizador root (ou Enter se nao tiver password)" -AsSecureString
$password = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword))

Write-Host ""
Write-Host "A executar script SQL..." -ForegroundColor Yellow

# Executar script SQL
$scriptPath = Join-Path $PSScriptRoot "add-email-verification.sql"

if ($password) {
    Get-Content $scriptPath -Encoding UTF8 | & $mysqlExe -u root -p$password ticketing
} else {
    Get-Content $scriptPath -Encoding UTF8 | & $mysqlExe -u root ticketing
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Campos de verificacao de email adicionados com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Proximos passos:" -ForegroundColor Cyan
    Write-Host "1. Execute: npx prisma generate" -ForegroundColor White
    Write-Host "2. Reinicie o servidor de desenvolvimento" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "Erro ao executar script SQL." -ForegroundColor Red
    Write-Host "Verifique se a base de dados ticketing existe e se tem permissoes." -ForegroundColor Yellow
}
