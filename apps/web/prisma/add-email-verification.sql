-- ============================================
-- Script para adicionar campos de verificação de email
-- Execute: mysql -u root -p ticketing < add-email-verification.sql
-- Ou use: .\add-email-verification.ps1
-- ============================================

USE ticketing;

-- Adicionar emailVerified (se não existir)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'ticketing' AND TABLE_NAME = 'User' AND COLUMN_NAME = 'emailVerified');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE `User` ADD COLUMN `emailVerified` BOOLEAN NOT NULL DEFAULT FALSE',
  'SELECT "Campo emailVerified já existe" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar emailVerificationToken (se não existir)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'ticketing' AND TABLE_NAME = 'User' AND COLUMN_NAME = 'emailVerificationToken');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE `User` ADD COLUMN `emailVerificationToken` VARCHAR(255) NULL',
  'SELECT "Campo emailVerificationToken já existe" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar emailVerificationTokenExpiresAt (se não existir)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'ticketing' AND TABLE_NAME = 'User' AND COLUMN_NAME = 'emailVerificationTokenExpiresAt');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE `User` ADD COLUMN `emailVerificationTokenExpiresAt` DATETIME(3) NULL',
  'SELECT "Campo emailVerificationTokenExpiresAt já existe" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar índice único para emailVerificationToken (se não existir)
SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'ticketing' AND TABLE_NAME = 'User' AND INDEX_NAME = 'idx_emailVerificationToken_unique');
SET @sql = IF(@idx_exists = 0, 
  'CREATE UNIQUE INDEX `idx_emailVerificationToken_unique` ON `User`(`emailVerificationToken`)',
  'SELECT "Índice idx_emailVerificationToken_unique já existe" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar índice normal para emailVerificationToken (para queries)
SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'ticketing' AND TABLE_NAME = 'User' AND INDEX_NAME = 'idx_emailVerificationToken');
SET @sql = IF(@idx_exists = 0, 
  'CREATE INDEX `idx_emailVerificationToken` ON `User`(`emailVerificationToken`)',
  'SELECT "Índice idx_emailVerificationToken já existe" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT '✓ Campos de verificação de email adicionados com sucesso!' as message;
