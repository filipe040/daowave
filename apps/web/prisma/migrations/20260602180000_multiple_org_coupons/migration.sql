-- Vários cupões por organização (MySQL/MariaDB)
ALTER TABLE `Coupon` DROP INDEX `Coupon_organizationId_key`;
CREATE INDEX `Coupon_organizationId_idx` ON `Coupon`(`organizationId`);
