# Guia de Correção - Erro 500 no Login em Produção

## Problema
Após fazer logout e tentar fazer login novamente, aparece o erro "500 | Internal Server Error" na VPS de produção.

## Diagnóstico Rápido

### 1. Execute o Script de Diagnóstico
Na sua VPS, no diretório do projeto:

```bash
# Navegue para o diretório da aplicação web
cd apps/web

# Execute o diagnóstico da base de dados
npm run diagnose:db
```

Este script vai verificar:
- ✅ Conexão com a base de dados
- ✅ Se as tabelas existem
- ✅ Se as colunas estão corretas
- ✅ Variáveis de ambiente

### 2. Verificar Logs da Aplicação
```bash
# Se estiver usando PM2
pm2 logs

# Se estiver usando Docker
docker logs container_name

# Se estiver rodando diretamente
# Verifique os logs no terminal onde está rodando
```

## Soluções Mais Comuns

### Solução 1: Aplicar Migrações em Falta ⭐ (MAIS PROVÁVEL)

```bash
# Na VPS, no diretório apps/web
npx prisma migrate deploy

# Gerar o cliente Prisma atualizado
npx prisma generate

# Reiniciar a aplicação
pm2 restart all
# OU
systemctl restart sua-aplicacao
# OU
docker-compose restart
```

### Solução 2: Verificar Variáveis de Ambiente

Verifique se o arquivo `.env` na VPS tem todas as variáveis necessárias:

```env
# Obrigatórias para login
DATABASE_URL="mysql://user:password@localhost:3306/database_name"
NEXTAUTH_SECRET="sua-chave-secreta-de-32-caracteres-ou-mais"
NEXTAUTH_URL="https://seu-dominio.com"
QR_SECRET="outra-chave-secreta-de-32-caracteres-ou-mais"
NODE_ENV="production"
```

### Solução 3: Reset Completo da Base de Dados (⚠️ CUIDADO)

**ATENÇÃO**: Isto vai apagar todos os dados!

```bash
# Fazer backup primeiro
mysqldump -u user -p database_name > backup.sql

# Reset das migrações
npx prisma migrate reset --force

# Aplicar todas as migrações
npx prisma migrate deploy

# Executar seed se necessário
npm run db:seed
```

### Solução 4: Verificar Permissões MySQL/PostgreSQL

```sql
-- Para MySQL
GRANT ALL PRIVILEGES ON database_name.* TO 'user'@'localhost';
FLUSH PRIVILEGES;

-- Para PostgreSQL
GRANT ALL PRIVILEGES ON DATABASE database_name TO user;
```

## Diagnóstico Avançado

### Verificar Status da Base de Dados
```bash
# MySQL
systemctl status mysql
mysql -u root -p -e "SHOW DATABASES;"

# PostgreSQL
systemctl status postgresql
sudo -u postgres psql -l
```

### Verificar Conexão Manual
```bash
# No diretório apps/web
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.count().then(count => {
  console.log('Users:', count);
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
"
```

### Verificar Schema da Base de Dados
```bash
# Ver estrutura das tabelas
npx prisma db pull
npx prisma format
```

## Erro Específico: Tabela User

Se o erro for relacionado com a tabela `User`, provavelmente faltam colunas novas:

```sql
-- Verificar se estas colunas existem na tabela User
DESCRIBE User;

-- Se faltarem, a migração vai adicioná-las:
-- avatarUrl, phone, emailVerifiedAt, lastLoginAt, termsAcceptedAt, 
-- termsVersion, marketingOptIn, notifyEmail, notifyEventReminders, notifyTransfers
```

## Erro Específico: Tabela UserSession

Se a tabela `UserSession` não existir:

```bash
# Forçar aplicação da migração específica
npx prisma migrate deploy --preview-feature
```

## Logs de Debug

Para ver logs detalhados durante o login:

```bash
# Adicionar ao .env temporariamente
NEXTAUTH_DEBUG=true
DEBUG="prisma:query"
```

## Checklist Final

- [ ] Executei `npm run diagnose:db`
- [ ] Executei `npx prisma migrate deploy`  
- [ ] Executei `npx prisma generate`
- [ ] Reiniciei a aplicação
- [ ] Verifiquei todas as variáveis de ambiente
- [ ] Base de dados está a correr
- [ ] Conexão com a base de dados funciona
- [ ] Logs não mostram erros de SQL

## Contacto de Emergência

Se nada funcionar:

1. **Fazer backup completo da base de dados**
2. **Guardar logs de erro completos**
3. **Verificar se o problema existe também em desenvolvimento local**

## Comandos de Recuperação Rápida

```bash
# Sequência completa de recuperação
cd apps/web
npm run diagnose:db
npx prisma migrate deploy
npx prisma generate
pm2 restart all

# Verificar se funcionou
curl -I https://seu-dominio.com/auth/signin
```

## Notas Importantes

- ✅ O problema é **quase sempre** migrações em falta
- ✅ Nunca fazer `prisma migrate reset` em produção sem backup
- ✅ Sempre testar em desenvolvimento primeiro
- ✅ Manter logs de todas as alterações feitas

---

**Última atualização**: Janeiro 2025
**Estado**: Testado em produção ✅