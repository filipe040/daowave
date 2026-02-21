/*
  Warnings:

  - You are about to drop the column `emailVerificationTokenExpiresAt` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `AuditLog` ADD COLUMN `ip` VARCHAR(45) NULL,
    ADD COLUMN `userAgent` VARCHAR(512) NULL;

-- AlterTable
ALTER TABLE `Organization` ADD COLUMN `address` VARCHAR(191) NULL,
    ADD COLUMN `country` VARCHAR(191) NULL,
    ADD COLUMN `legalName` VARCHAR(191) NULL,
    ADD COLUMN `logoUrl` VARCHAR(191) NULL,
    ADD COLUMN `phone` VARCHAR(191) NULL,
    ADD COLUMN `website` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `OrganizationMember` ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    MODIFY `role` ENUM('PROMOTER_OWNER', 'PROMOTER_MANAGER', 'PROMOTER_STAFF', 'OWNER', 'MANAGER', 'STAFF', 'READ_ONLY') NOT NULL DEFAULT 'PROMOTER_STAFF';

-- AlterTable
ALTER TABLE `User` DROP COLUMN `emailVerificationTokenExpiresAt`,
    ADD COLUMN `locale` VARCHAR(191) NOT NULL DEFAULT 'pt',
    ADD COLUMN `onboardingComplete` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `Invite` (
    `id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `role` ENUM('PROMOTER_OWNER', 'PROMOTER_MANAGER', 'PROMOTER_STAFF', 'OWNER', 'MANAGER', 'STAFF', 'READ_ONLY') NOT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED') NOT NULL DEFAULT 'PENDING',
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `acceptedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Invite_token_key`(`token`),
    INDEX `Invite_token_idx`(`token`),
    INDEX `Invite_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Invite` ADD CONSTRAINT `Invite_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
