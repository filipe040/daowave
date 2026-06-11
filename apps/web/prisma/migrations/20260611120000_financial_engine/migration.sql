-- LivePass Financial Engine

-- Enums via ALTER (MySQL)

ALTER TABLE `FinancialSettings`
    ADD COLUMN `pricingMode` ENUM('FORMULA', 'TIERED') NOT NULL DEFAULT 'FORMULA',
    ADD COLUMN `serviceFeeFixedCents` INT NOT NULL DEFAULT 50,
    ADD COLUMN `minimumServiceFeeCents` INT NOT NULL DEFAULT 149,
    ADD COLUMN `maximumServiceFeeCents` INT NULL,
    ADD COLUMN `operationalReserveCents` INT NOT NULL DEFAULT 20,
    ADD COLUMN `roundingMode` ENUM('NONE', 'END_49', 'END_99', 'END_49_99') NOT NULL DEFAULT 'END_49_99',
    ADD COLUMN `absorbPaymentFees` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `defaultFeePaidBy` ENUM('BUYER', 'ORGANIZER') NOT NULL DEFAULT 'BUYER';

ALTER TABLE `PromoterFinancialSettings`
    ADD COLUMN `pricingMode` ENUM('GLOBAL', 'CUSTOM') NOT NULL DEFAULT 'GLOBAL',
    ADD COLUMN `customFixedFeeCents` INT NULL,
    ADD COLUMN `customPercentageFee` DECIMAL(5, 2) NULL,
    ADD COLUMN `customMinimumFeeCents` INT NULL,
    ADD COLUMN `customMaximumFeeCents` INT NULL,
    ADD COLUMN `customOperationalReserveCents` INT NULL,
    ADD COLUMN `feePaidBy` ENUM('BUYER', 'ORGANIZER') NULL,
    ADD COLUMN `settlementFrequency` ENUM('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'MANUAL') NOT NULL DEFAULT 'MANUAL',
    ADD COLUMN `lastSettlementAt` DATETIME(3) NULL,
    ADD COLUMN `active` BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE `Order`
    ADD COLUMN `serviceFeeCents` INT NOT NULL DEFAULT 0,
    ADD COLUMN `feePaidBy` ENUM('BUYER', 'ORGANIZER') NULL;

ALTER TABLE `OrderFinancialBreakdown`
    ADD COLUMN `feePaidBy` ENUM('BUYER', 'ORGANIZER') NULL,
    ADD COLUMN `operationalReserveCents` INT NOT NULL DEFAULT 0,
    ADD COLUMN `appliedCampaignId` VARCHAR(64) NULL,
    ADD COLUMN `appliedTierId` VARCHAR(64) NULL,
    ADD COLUMN `pricingModeUsed` VARCHAR(32) NULL;

CREATE TABLE `commission_tiers` (
    `id` VARCHAR(191) NOT NULL,
    `minPriceCents` INT NOT NULL,
    `maxPriceCents` INT NULL,
    `fixedFeeCents` INT NOT NULL DEFAULT 0,
    `percentageFee` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INT NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    INDEX `commission_tiers_active_sortOrder_idx`(`active`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `fee_campaigns` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(128) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `discountType` ENUM('PERCENT_OFF_FEE', 'FIXED_FEE_OVERRIDE', 'ZERO_FEE') NOT NULL,
    `discountValue` DECIMAL(10, 4) NOT NULL DEFAULT 0,
    `organizationId` VARCHAR(191) NULL,
    `firstEventOnly` BOOLEAN NOT NULL DEFAULT false,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    INDEX `fee_campaigns_active_startDate_endDate_idx`(`active`, `startDate`, `endDate`),
    INDEX `fee_campaigns_organizationId_idx`(`organizationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `fee_campaigns` ADD CONSTRAINT `fee_campaigns_organizationId_fkey`
    FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed commission tiers (example tiers from spec)
INSERT INTO `commission_tiers` (`id`, `minPriceCents`, `maxPriceCents`, `fixedFeeCents`, `percentageFee`, `sortOrder`, `updatedAt`) VALUES
(UUID(), 0, 1000, 99, 0, 1, NOW(3)),
(UUID(), 1000, 2500, 149, 0, 2, NOW(3)),
(UUID(), 2500, 5000, 249, 0, 3, NOW(3)),
(UUID(), 5000, 10000, 399, 0, 4, NOW(3)),
(UUID(), 10000, NULL, 499, 2.00, 5, NOW(3));

-- Update global defaults to match spec example
UPDATE `FinancialSettings` SET
    `serviceFeeFixedCents` = 50,
    `serviceFeeValue` = 6,
    `minimumServiceFeeCents` = 149,
    `maximumServiceFeeCents` = 999,
    `operationalReserveCents` = 20,
    `roundingMode` = 'END_49_99',
    `absorbPaymentFees` = true,
    `defaultFeePaidBy` = 'BUYER',
    `pricingMode` = 'FORMULA'
WHERE `id` = 'default';
