-- Add avatarUrl to User (MySQL: run once; if column already exists, ignore or mark migration as applied)
ALTER TABLE `User` ADD COLUMN `avatarUrl` VARCHAR(2048) NULL;
