/*
  Warnings:

  - A unique constraint covering the columns `[passwordResetToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable (Coupon/User/Ticket/Event checkin columns já existem em 20260128180526; só adicionamos archivedAt e EventAsset)
ALTER TABLE `Event`
    ADD COLUMN IF NOT EXISTS `archivedAt` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE IF NOT EXISTS `EventAsset` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `filename` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `size` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `EventAsset_eventId_idx`(`eventId`),
    INDEX `EventAsset_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey (Coupon_eventId_fkey já foi criado em 20260128180526)
ALTER TABLE `EventAsset` ADD CONSTRAINT `EventAsset_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
