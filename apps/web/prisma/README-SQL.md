# Executar Script SQL - MariaDB

## Método 1: PowerShell Script (Recomendado)

```powershell
cd apps\web\prisma
.\run-database.ps1
```

## Método 2: Linha de Comandos Manual

### Se mysql está no PATH:
```powershell
cd apps\web
Get-Content prisma\database.sql | mysql -u root -p
```

### Se mysql NÃO está no PATH:
```powershell
cd apps\web
& "C:\Program Files\MariaDB\MariaDB 11.x\bin\mysql.exe" -u root -p < prisma\database.sql
```

**Nota**: Substitua `11.x` pela versão instalada.

## Método 3: Dentro do MySQL

```powershell
mysql -u root -p
```

Depois execute:
```sql
USE ticketing;
source C:/Users/vasco/OneDrive/Ambiente de Trabalho/App_bilheteira/apps/web/prisma/database.sql
```

Ou copie e cole o conteúdo do arquivo diretamente.

## Verificar se Funcionou

```powershell
mysql -u ticketing -pticketing_dev_password ticketing -e "SHOW TABLES;"
```

Deve mostrar todas as tabelas criadas.
