-- Migration: ensure missing columns exist and types are safe
-- Idempotent: uses IF NOT EXISTS where supported

-- Add avatarUrl to User
ALTER TABLE `User` ADD COLUMN IF NOT EXISTS `avatarUrl` VARCHAR(2048) NULL;

-- Event archive + checkin configuration
ALTER TABLE `Event`
  ADD COLUMN IF NOT EXISTS `archivedAt` DATETIME NULL,
  ADD COLUMN IF NOT EXISTS `checkinMode` VARCHAR(191) NULL DEFAULT 'SINGLE',
  ADD COLUMN IF NOT EXISTS `checkinStartAt` DATETIME NULL,
  ADD COLUMN IF NOT EXISTS `checkinEndAt` DATETIME NULL,
  ADD COLUMN IF NOT EXISTS `maxEntries` INTEGER NULL;

-- Make badge template a TEXT to avoid truncation errors
-- Some MySQL versions don't support MODIFY IF NOT EXISTS, so run conditionally below if necessary
SET @has_col := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='Event' AND COLUMN_NAME='badgeTemplateImageUrl');
-- If column exists and is not TEXT, modify it
-- Note: Some MySQL/MariaDB versions might not allow procedural statements in plain migration. If this fails, please run manually:
-- ALTER TABLE `Event` MODIFY COLUMN `badgeTemplateImageUrl` TEXT NULL;

-- Create EventAsset table if not exists (structure expected by app)
CREATE TABLE IF NOT EXISTS `EventAsset` (
  `id` VARCHAR(191) NOT NULL,
  `eventId` VARCHAR(191) NOT NULL,
  `filename` VARCHAR(1024) NOT NULL,
  `url` VARCHAR(2048) NOT NULL,
  `mimeType` VARCHAR(191) NOT NULL,
  `size` INT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Indexes (se a tabela foi criada em 20260128184926, os índices já existem)
CREATE INDEX IF NOT EXISTS `EventAsset_eventId_idx` ON `EventAsset`(`eventId`);
CREATE INDEX IF NOT EXISTS `EventAsset_createdAt_idx` ON `EventAsset`(`createdAt`);

-- FK EventAsset_eventId_fkey já criada em 20260128184926; não duplicar.

