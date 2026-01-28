-- AlterTable
ALTER TABLE `Event` ADD COLUMN `badgePrefix` VARCHAR(191) NULL DEFAULT 'BADGE',
    ADD COLUMN `badgeTemplateImageUrl` VARCHAR(191) NULL;
