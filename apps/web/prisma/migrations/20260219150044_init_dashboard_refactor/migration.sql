/*
  Warnings:

  - You are about to drop the column `badgePrefix` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `badgeTemplateImageUrl` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `fontFamily` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `landingPageContent` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `maxEntries` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `useCustomLandingPage` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `entriesUsed` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `lastCheckinAt` on the `Ticket` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `CheckinLog_offline_syncedAt_idx` ON `CheckinLog`;

-- DropIndex
DROP INDEX `Coupon_endsAt_idx` ON `Coupon`;

-- DropIndex
DROP INDEX `Coupon_isActive_idx` ON `Coupon`;

-- DropIndex
DROP INDEX `EmailLog_relatedOrderId_idx` ON `EmailLog`;

-- DropIndex
DROP INDEX `EmailLog_relatedUserId_idx` ON `EmailLog`;

-- DropIndex
DROP INDEX `EmailLog_type_idx` ON `EmailLog`;

-- DropIndex
DROP INDEX `EventAsset_createdAt_idx` ON `EventAsset`;

-- DropIndex
DROP INDEX `EventTeamMember_isActive_idx` ON `EventTeamMember`;

-- DropIndex
DROP INDEX `EventTeamMember_role_idx` ON `EventTeamMember`;

-- DropIndex
DROP INDEX `EventTeamMemberPermission_permission_idx` ON `EventTeamMemberPermission`;

-- AlterTable
ALTER TABLE `AuditLog` ADD COLUMN `organizationId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `CheckinLog` MODIFY `rawPayloadHash` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Event` DROP COLUMN `badgePrefix`,
    DROP COLUMN `badgeTemplateImageUrl`,
    DROP COLUMN `fontFamily`,
    DROP COLUMN `landingPageContent`,
    DROP COLUMN `maxEntries`,
    DROP COLUMN `useCustomLandingPage`,
    ADD COLUMN `organizationId` VARCHAR(191) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `description` TEXT NOT NULL,
    MODIFY `status` ENUM('DRAFT', 'PUBLISHED', 'CANCELLED', 'ENDED') NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE `Order` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `status` ENUM('PENDING', 'PAID', 'CANCELED', 'REFUNDED') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `Payout` ADD COLUMN `organizationId` VARCHAR(191) NULL,
    ADD COLUMN `periodEnd` DATETIME(3) NULL,
    ADD COLUMN `periodStart` DATETIME(3) NULL,
    MODIFY `promoterId` VARCHAR(191) NULL,
    MODIFY `status` ENUM('PENDING', 'PROCESSING', 'PAID', 'FAILED') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `Ticket` DROP COLUMN `entriesUsed`,
    DROP COLUMN `lastCheckinAt`,
    ADD COLUMN `status` ENUM('VALID', 'USED', 'CANCELLED', 'REFUNDED') NOT NULL DEFAULT 'VALID',
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `TicketLot` ADD COLUMN `description` VARCHAR(191) NULL,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `TrackingLink` ADD COLUMN `clicks` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `conversions` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `User` MODIFY `role` ENUM('USER', 'PROMOTER', 'ADMIN', 'VALIDATOR') NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE `Organization` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `vatNumber` VARCHAR(191) NULL,
    `contactEmail` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Organization_slug_key`(`slug`),
    INDEX `Organization_slug_idx`(`slug`),
    INDEX `Organization_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrganizationMember` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `role` ENUM('OWNER', 'MANAGER', 'STAFF', 'READ_ONLY') NOT NULL DEFAULT 'STAFF',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `OrganizationMember_userId_idx`(`userId`),
    UNIQUE INDEX `OrganizationMember_organizationId_userId_key`(`organizationId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FraudSignal` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `orderId` VARCHAR(191) NULL,
    `ticketId` VARCHAR(191) NULL,
    `type` VARCHAR(191) NOT NULL,
    `severity` VARCHAR(191) NOT NULL,
    `score` INTEGER NOT NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FraudSignal_userId_idx`(`userId`),
    INDEX `FraudSignal_type_idx`(`type`),
    INDEX `FraudSignal_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `AuditLog_organizationId_idx` ON `AuditLog`(`organizationId`);

-- CreateIndex
CREATE INDEX `Event_organizationId_idx` ON `Event`(`organizationId`);

-- CreateIndex
CREATE INDEX `Payout_organizationId_idx` ON `Payout`(`organizationId`);

-- AddForeignKey
ALTER TABLE `OrganizationMember` ADD CONSTRAINT `OrganizationMember_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrganizationMember` ADD CONSTRAINT `OrganizationMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FraudSignal` ADD CONSTRAINT `FraudSignal_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payout` ADD CONSTRAINT `Payout_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
