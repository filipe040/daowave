/*
  Warnings:

  - A unique constraint covering the columns `[passwordResetToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable (idempotente para bases já parcialmente migradas)
ALTER TABLE `Event`
    ADD COLUMN IF NOT EXISTS `checkinEndAt` DATETIME(3) NULL,
    ADD COLUMN IF NOT EXISTS `checkinMode` VARCHAR(191) NULL DEFAULT 'SINGLE',
    ADD COLUMN IF NOT EXISTS `checkinStartAt` DATETIME(3) NULL,
    ADD COLUMN IF NOT EXISTS `maxEntries` INTEGER NULL;

-- AlterTable
ALTER TABLE `Ticket`
    ADD COLUMN IF NOT EXISTS `entriesUsed` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS `lastCheckinAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `User`
    ADD COLUMN IF NOT EXISTS `passwordResetToken` VARCHAR(191) NULL,
    ADD COLUMN IF NOT EXISTS `passwordResetTokenExpiresAt` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE IF NOT EXISTS `Coupon` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `discountType` ENUM('PERCENTAGE', 'FIXED') NOT NULL,
    `discountValue` INTEGER NOT NULL,
    `maxUses` INTEGER NULL,
    `usedCount` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `startsAt` DATETIME(3) NOT NULL,
    `endsAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Coupon_code_key`(`code`),
    INDEX `Coupon_eventId_idx`(`eventId`),
    INDEX `Coupon_code_idx`(`code`),
    INDEX `Coupon_isActive_idx`(`isActive`),
    INDEX `Coupon_endsAt_idx`(`endsAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS `User_passwordResetToken_key` ON `User`(`passwordResetToken`);

-- AddForeignKey Coupon_eventId_fkey apenas se ainda não existir (idempotente)
SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'Coupon' AND CONSTRAINT_NAME = 'Coupon_eventId_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY');
SET @sql = IF(@fk_exists = 0, 'ALTER TABLE `Coupon` ADD CONSTRAINT `Coupon_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
