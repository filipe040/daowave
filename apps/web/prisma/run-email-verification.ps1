# Script simples para executar add-email-verification.sql
# Execute: .\run-email-verification.ps1

# Funcao para encontrar MySQL (mesma logica do run-database.ps1)
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
        
        $mysqlDirs = Get-ChildItem -Path $programFiles -Filter "MySQL*" -Directory -ErrorAction SilentlyContinue
        foreach ($dir in $mysqlDirs) {
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

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Adicionar Campos de Verificacao de Email" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$mysqlExe = Find-MySQL

if (-not $mysqlExe) {
    Write-Host "mysql.exe nao encontrado automaticamente!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor, execute manualmente no seu terminal:" -ForegroundColor Yellow
    Write-Host "Get-Content add-email-verification.sql | & 'C:\caminho\para\mysql.exe' -u root ticketing" -ForegroundColor White
    exit 1
}

Write-Host "mysql.exe encontrado: $mysqlExe" -ForegroundColor Green
Write-Host ""
Write-Host "A executar script SQL..." -ForegroundColor Yellow

# Executar SQL (sem password - se precisar, adicione -p)
Get-Content add-email-verification.sql -Encoding UTF8 | & $mysqlExe -u root ticketing

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Campos de verificacao de email adicionados com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Proximos passos:" -ForegroundColor Cyan
    Write-Host "1. Execute: cd ..; npx prisma generate" -ForegroundColor White
    Write-Host "2. Reinicie o servidor de desenvolvimento" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "Erro ao executar script SQL." -ForegroundColor Red
    Write-Host ""
    Write-Host "Se o root tem password, edite a linha 67 deste script e adicione -p:" -ForegroundColor Yellow
    Write-Host "Get-Content add-email-verification.sql -Encoding UTF8 | & `$mysqlExe -u root -p ticketing" -ForegroundColor White
}
