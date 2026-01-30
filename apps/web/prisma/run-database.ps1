# Script para executar database.sql no MariaDB
# Execute: .\run-database.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Criar Base de Dados - MariaDB" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Funcao para encontrar MySQL
function Find-MySQL {
    # Verificar se esta no PATH
    $found = Get-Command mysql -ErrorAction SilentlyContinue
    if ($found) {
        return "mysql"
    }
    
    # Procurar em Program Files
    $programFiles = "C:\Program Files"
    if (Test-Path $programFiles) {
        $mariadbDirs = Get-ChildItem -Path $programFiles -Filter "MariaDB*" -Directory -ErrorAction SilentlyContinue
        foreach ($dir in $mariadbDirs) {
            $mysqlPath = Join-Path $dir.FullName "bin\mysql.exe"
            if (Test-Path $mysqlPath) {
                return $mysqlPath
            }
        }
    }
    
    # Procurar em Program Files (x86)
    $programFiles86 = "C:\Program Files (x86)"
    if (Test-Path $programFiles86) {
        $mariadbDirs = Get-ChildItem -Path $programFiles86 -Filter "MariaDB*" -Directory -ErrorAction SilentlyContinue
        foreach ($dir in $mariadbDirs) {
            $mysqlPath = Join-Path $dir.FullName "bin\mysql.exe"
            if (Test-Path $mysqlPath) {
                return $mysqlPath
            }
        }
    }
    
    return $null
}

$mysqlExe = Find-MySQL

if (-not $mysqlExe) {
    Write-Host "MariaDB/MySQL nao encontrado automaticamente!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor, indique o caminho completo do mysql.exe:" -ForegroundColor Yellow
    Write-Host "Exemplo: C:\Program Files\MariaDB\MariaDB 11.4\bin\mysql.exe" -ForegroundColor Gray
    Write-Host ""
    $manualPath = Read-Host "Caminho do mysql.exe (ou Enter para cancelar)"
    
    if ([string]::IsNullOrWhiteSpace($manualPath)) {
        Write-Host ""
        Write-Host "Cancelado. Execute manualmente:" -ForegroundColor Yellow
        Write-Host "1. Abra o MySQL Workbench ou HeidiSQL" -ForegroundColor White
        Write-Host "2. Conecte-se como root" -ForegroundColor White
        Write-Host "3. Abra o arquivo database.sql e execute" -ForegroundColor White
        exit 1
    }
    
    if (Test-Path $manualPath) {
        $mysqlExe = $manualPath
    } else {
        Write-Host "Caminho invalido!" -ForegroundColor Red
        exit 1
    }
}

Write-Host "MySQL encontrado: $mysqlExe" -ForegroundColor Green
Write-Host ""

# Pedir password (pode deixar em branco se nao tiver)
$passwordInput = Read-Host "Insira a password do root (ou Enter se nao tiver password)"

Write-Host ""
Write-Host "Executando script SQL..." -ForegroundColor Yellow

$sqlFile = Join-Path $PSScriptRoot "database.sql"

if (-not (Test-Path $sqlFile)) {
    Write-Host "Arquivo database.sql nao encontrado em: $sqlFile" -ForegroundColor Red
    exit 1
}

try {
    # Se nao tem password, nao usar -p
    if ([string]::IsNullOrWhiteSpace($passwordInput)) {
        Write-Host "Executando sem password..." -ForegroundColor Gray
        if ($mysqlExe -eq "mysql") {
            Get-Content $sqlFile | & mysql -u root 2>&1
        } else {
            $content = Get-Content $sqlFile -Raw
            $content | & $mysqlExe -u root 2>&1
        }
    } else {
        if ($mysqlExe -eq "mysql") {
            Get-Content $sqlFile | & mysql -u root -p$passwordInput 2>&1
        } else {
            $content = Get-Content $sqlFile -Raw
            $content | & $mysqlExe -u root -p$passwordInput 2>&1
        }
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Base de dados criada com sucesso!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Proximos passos:" -ForegroundColor Cyan
        Write-Host "1. Configurar .env com DATABASE_URL" -ForegroundColor White
        Write-Host "2. npx prisma generate" -ForegroundColor White
        Write-Host "3. (Opcional) Execute o script de seed do projeto se existir." -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "Erro ao executar script SQL" -ForegroundColor Red
        Write-Host "Verifique a password e tente novamente." -ForegroundColor Yellow
    }
} catch {
    Write-Host ""
    Write-Host "Erro: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Tente executar manualmente:" -ForegroundColor Yellow
    Write-Host "1. Abra o MySQL Workbench ou HeidiSQL" -ForegroundColor White
    Write-Host "2. Conecte-se como root" -ForegroundColor White
    Write-Host "3. Abra e execute o arquivo: $sqlFile" -ForegroundColor White
}
