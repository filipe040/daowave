-- Add avatarUrl to User (idempotente: 20260201120000 já pode tê-lo adicionado)
ALTER TABLE `User` ADD COLUMN IF NOT EXISTS `avatarUrl` VARCHAR(2048) NULL;
