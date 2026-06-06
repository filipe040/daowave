-- Comissões por cupão atribuído a membro da equipa (MySQL/MariaDB)
ALTER TABLE `Coupon`
  ADD COLUMN `assignedMemberId` VARCHAR(191) NULL,
  ADD COLUMN `commissionCents` INT NULL;

ALTER TABLE `Coupon`
  ADD CONSTRAINT `Coupon_assignedMemberId_fkey`
  FOREIGN KEY (`assignedMemberId`) REFERENCES `OrganizationMember`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX `Coupon_assignedMemberId_idx` ON `Coupon`(`assignedMemberId`);

CREATE TABLE `CouponCommission` (
  `id` VARCHAR(191) NOT NULL,
  `couponId` VARCHAR(191) NOT NULL,
  `orderId` VARCHAR(191) NOT NULL,
  `memberId` VARCHAR(191) NOT NULL,
  `amountCents` INT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `CouponCommission_orderId_key`(`orderId`),
  INDEX `CouponCommission_couponId_idx`(`couponId`),
  INDEX `CouponCommission_memberId_idx`(`memberId`),
  INDEX `CouponCommission_createdAt_idx`(`createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `CouponCommission`
  ADD CONSTRAINT `CouponCommission_couponId_fkey`
  FOREIGN KEY (`couponId`) REFERENCES `Coupon`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `CouponCommission`
  ADD CONSTRAINT `CouponCommission_orderId_fkey`
  FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `CouponCommission`
  ADD CONSTRAINT `CouponCommission_memberId_fkey`
  FOREIGN KEY (`memberId`) REFERENCES `OrganizationMember`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
