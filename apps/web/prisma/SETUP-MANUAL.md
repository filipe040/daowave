# Setup Manual da Base de Dados

Se o script PowerShell não funcionar, siga estes passos:

## Opção 1: MySQL Workbench (Recomendado)

1. **Abrir MySQL Workbench**
2. **Conectar como root** (clique na conexão local)
3. **Abrir o arquivo SQL**:
   - File → Open SQL Script
   - Navegar até: `apps/web/prisma/database.sql`
4. **Executar**:
   - Clique no botão ⚡ (Execute) ou pressione `Ctrl+Shift+Enter`

## Opção 2: HeidiSQL

1. **Abrir HeidiSQL**
2. **Conectar como root**
3. **Abrir arquivo SQL**:
   - File → Load SQL file
   - Selecionar: `apps/web/prisma/database.sql`
4. **Executar**: F9 ou botão Execute

## Opção 3: Linha de Comandos (se MySQL estiver no PATH)

**Com password:**
```powershell
cd apps\web\prisma
mysql -u root -p < database.sql
```

**Sem password:**
```powershell
cd apps\web\prisma
mysql -u root < database.sql
```

## Opção 4: Copiar e Colar

1. Abrir `apps/web/prisma/database.sql` num editor de texto
2. Copiar TODO o conteúdo (Ctrl+A, Ctrl+C)
3. Abrir MySQL Workbench ou HeidiSQL
4. Criar nova query
5. Colar o conteúdo (Ctrl+V)
6. Executar

## Verificar se Funcionou

Execute esta query no MySQL:

```sql
USE ticketing;
SHOW TABLES;
```

Deve mostrar:
- User
- PromoterProfile
- Event
- TicketLot
- Order
- OrderItem
- Ticket
- AuditLog

## Próximos Passos

Depois de criar a base de dados:

1. **Configurar .env**:
   ```env
   DATABASE_URL="mysql://ticketing:ticketing_dev_password@localhost:3306/ticketing"
   ```

2. **Gerar Prisma Client**:
   ```bash
   npx prisma generate
   ```

3. **Popular dados de teste**:
   ```bash
   npx tsx prisma/seed-clean.ts
   ```
