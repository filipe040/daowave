-- Migration: oauth-account-linking
-- Adds Account model for OAuth providers and makes passwordHash nullable

-- Step 1: Make passwordHash nullable (safe - existing data unchanged)
ALTER TABLE `User` MODIFY COLUMN `passwordHash` VARCHAR(191) NULL;

-- Step 2: Create Account table for OAuth providers
CREATE TABLE `Account` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `provider` VARCHAR(191) NOT NULL,
  `providerAccountId` VARCHAR(191) NOT NULL,
  `email` VARCHAR(512) NULL,
  `accessToken` LONGTEXT NULL,
  `refreshToken` LONGTEXT NULL,
  `idToken` LONGTEXT NULL,
  `expiresAt` INT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE KEY `Account_provider_providerAccountId_key` (`provider`, `providerAccountId`(191)),
  INDEX `Account_userId_idx` (`userId`),
  INDEX `Account_provider_email_idx` (`provider`, `email`(191)),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Step 3: Add FK constraint
ALTER TABLE `Account`
  ADD CONSTRAINT `Account_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
