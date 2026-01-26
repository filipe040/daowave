-- Migration: Add email verification fields to User table
-- Date: 2025-01-XX

-- Add email verification fields
ALTER TABLE `User` 
  ADD COLUMN `emailVerified` BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN `emailVerificationToken` VARCHAR(191) NULL,
  ADD COLUMN `emailVerificationTokenExpiresAt` DATETIME(3) NULL;

-- Add unique index for emailVerificationToken
CREATE UNIQUE INDEX `User_emailVerificationToken_key` ON `User`(`emailVerificationToken`);

-- Add index for emailVerificationToken (for faster lookups)
CREATE INDEX `User_emailVerificationToken_idx` ON `User`(`emailVerificationToken`);
