-- Um cupão de desconto por organização (MySQL/MariaDB)
ALTER TABLE `Coupon` ADD COLUMN `organizationId` VARCHAR(191) NULL;

UPDATE `Coupon` c
INNER JOIN `Event` e ON c.`eventId` = e.`id`
SET c.`organizationId` = e.`organizationId`;

DELETE c1 FROM `Coupon` c1
INNER JOIN `Coupon` c2
  ON c1.`organizationId` = c2.`organizationId`
 AND c1.`createdAt` < c2.`createdAt`;

ALTER TABLE `Coupon` MODIFY COLUMN `organizationId` VARCHAR(191) NOT NULL;

ALTER TABLE `Coupon`
  ADD CONSTRAINT `Coupon_organizationId_fkey`
  FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Coupon` ADD UNIQUE INDEX `Coupon_organizationId_key` (`organizationId`);
