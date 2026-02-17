-- Fase 2: PromoterProfile (score, adminNotes), TrackingLink, Payout

-- AlterTable PromoterProfile
ALTER TABLE `PromoterProfile` ADD COLUMN `score` INTEGER NULL,
    ADD COLUMN `adminNotes` TEXT NULL;

-- CreateTable TrackingLink
CREATE TABLE `TrackingLink` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `TrackingLink_eventId_code_key`(`eventId`, `code`),
    INDEX `TrackingLink_eventId_idx`(`eventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateEnum PayoutStatus (MySQL: no native enum for table, use column type)
-- CreateTable Payout
CREATE TABLE `Payout` (
    `id` VARCHAR(191) NOT NULL,
    `promoterId` VARCHAR(191) NOT NULL,
    `amountCents` INTEGER NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'EUR',
    `status` ENUM('PENDING', 'PAID', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `paidAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Payout_promoterId_idx`(`promoterId`),
    INDEX `Payout_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TrackingLink` ADD CONSTRAINT `TrackingLink_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Payout` ADD CONSTRAINT `Payout_promoterId_fkey` FOREIGN KEY (`promoterId`) REFERENCES `PromoterProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
