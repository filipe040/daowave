/*
  Warnings:

  - You are about to drop the column `ticketBannerUrl` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `ticketPrimaryColor` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `ticketSecondaryColor` on the `Event` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Event` DROP COLUMN `ticketBannerUrl`,
    DROP COLUMN `ticketPrimaryColor`,
    DROP COLUMN `ticketSecondaryColor`,
    ADD COLUMN `bannerUrl` VARCHAR(191) NULL,
    ADD COLUMN `fontFamily` VARCHAR(191) NULL,
    ADD COLUMN `landingPageContent` TEXT NULL,
    ADD COLUMN `logoUrl` VARCHAR(191) NULL,
    ADD COLUMN `primaryColor` VARCHAR(191) NULL,
    ADD COLUMN `secondaryColor` VARCHAR(191) NULL,
    ADD COLUMN `useCustomLandingPage` BOOLEAN NOT NULL DEFAULT false;
