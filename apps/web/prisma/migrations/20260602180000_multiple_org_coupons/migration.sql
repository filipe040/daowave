-- Vários cupões por organização (MySQL/MariaDB)
-- O índice UNIQUE foi criado após a FK e o MySQL usa-o na constraint — é preciso
-- remover a FK primeiro, depois o índice único, recriar índice normal e a FK.

ALTER TABLE `Coupon` DROP FOREIGN KEY `Coupon_organizationId_fkey`;

ALTER TABLE `Coupon` DROP INDEX `Coupon_organizationId_key`;

CREATE INDEX `Coupon_organizationId_idx` ON `Coupon`(`organizationId`);

ALTER TABLE `Coupon`
  ADD CONSTRAINT `Coupon_organizationId_fkey`
  FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
