-- User profile and preference columns (MariaDB compatible: no IF NOT EXISTS)
ALTER TABLE `User` ADD COLUMN `phone` VARCHAR(32) NULL;
ALTER TABLE `User` ADD COLUMN `emailVerifiedAt` DATETIME(3) NULL;
ALTER TABLE `User` ADD COLUMN `lastLoginAt` DATETIME(3) NULL;
ALTER TABLE `User` ADD COLUMN `termsAcceptedAt` DATETIME(3) NULL;
ALTER TABLE `User` ADD COLUMN `termsVersion` VARCHAR(32) NULL;
ALTER TABLE `User` ADD COLUMN `marketingOptIn` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `User` ADD COLUMN `notifyEmail` BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE `User` ADD COLUMN `notifyEventReminders` BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE `User` ADD COLUMN `notifyTransfers` BOOLEAN NOT NULL DEFAULT true;

-- UserSession table for session management
CREATE TABLE `UserSession` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `ip` VARCHAR(45) NULL,
  `userAgent` VARCHAR(512) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `lastSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `revokedAt` DATETIME(3) NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `UserSession_userId_idx` ON `UserSession`(`userId`);
CREATE INDEX `UserSession_revokedAt_idx` ON `UserSession`(`revokedAt`);

ALTER TABLE `UserSession` ADD CONSTRAINT `UserSession_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
