-- Perfil público de organização (ativado manualmente pelo admin)
ALTER TABLE `Organization`
  ADD COLUMN `bannerUrl` VARCHAR(2048) NULL,
  ADD COLUMN `publicBio` TEXT NULL,
  ADD COLUMN `publicProfileEnabled` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `publicProfileEnabledAt` DATETIME(3) NULL,
  ADD COLUMN `publicProfileNote` TEXT NULL;

CREATE INDEX `Organization_publicProfileEnabled_idx` ON `Organization`(`publicProfileEnabled`);
