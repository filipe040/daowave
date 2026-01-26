-- ============================================
-- Script para criar tabela EmailLog
-- Execute: mysql -u root -p ticketing < create-email-log.sql
-- ============================================

USE ticketing;

-- Criar tabela EmailLog se não existir
CREATE TABLE IF NOT EXISTS EmailLog (
  id CHAR(36) NOT NULL PRIMARY KEY,
  `to` VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  template VARCHAR(100) NULL,
  type VARCHAR(50) NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  sentAt DATETIME(3) NULL,
  error TEXT NULL,
  retryCount INT NOT NULL DEFAULT 0,
  providerMessageId VARCHAR(255) NULL,
  relatedOrderId CHAR(36) NULL,
  relatedTicketId CHAR(36) NULL,
  relatedUserId CHAR(36) NULL,
  meta JSON NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  
  INDEX idx_to (`to`),
  INDEX idx_status (status),
  INDEX idx_createdAt (createdAt),
  INDEX idx_type (type),
  INDEX idx_relatedOrderId (relatedOrderId),
  INDEX idx_relatedUserId (relatedUserId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT '✓ Tabela EmailLog criada com sucesso!' as message;
