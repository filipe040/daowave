-- LivePass Enterprise Finance Layer

-- Payment methods
CREATE TABLE `payment_methods` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(64) NOT NULL,
    `code` VARCHAR(32) NOT NULL,
    `fixedFee` DECIMAL(10, 4) NOT NULL DEFAULT 0,
    `percentageFee` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `vatPercentage` DECIMAL(5, 2) NOT NULL DEFAULT 23,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `payment_methods_code_key`(`code`),
    INDEX `payment_methods_active_idx`(`active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `payment_methods` (`id`, `name`, `code`, `fixedFee`, `percentageFee`, `vatPercentage`, `updatedAt`) VALUES
(UUID(), 'MB Way', 'MBWAY', 0.0700, 0.70, 23, NOW(3)),
(UUID(), 'Multibanco', 'MULTIBANCO', 0.2000, 1.50, 23, NOW(3)),
(UUID(), 'Visa', 'VISA', 0.2000, 1.50, 23, NOW(3)),
(UUID(), 'Mastercard', 'MASTERCARD', 0.2000, 1.50, 23, NOW(3)),
(UUID(), 'Apple Pay', 'APPLE_PAY', 0.2000, 1.50, 23, NOW(3)),
(UUID(), 'Google Pay', 'GOOGLE_PAY', 0.2000, 1.50, 23, NOW(3)),
(UUID(), 'EuroPix', 'EUROPIX', 0.1500, 1.80, 23, NOW(3)),
(UUID(), 'Payshop', 'PAYSHOP', 0.6000, 0.00, 23, NOW(3)),
(UUID(), 'SEPA', 'SEPA', 0.4500, 0.00, 23, NOW(3)),
(UUID(), 'Pagaqui', 'PAGAQUI', 0.3000, 0.00, 23, NOW(3)),
(UUID(), 'Paysafecard', 'PAYSAFECARD', 0.0000, 12.00, 23, NOW(3));

-- Financial settings enterprise columns
ALTER TABLE `FinancialSettings`
    ADD COLUMN `serviceFeeType` ENUM('PERCENTAGE', 'FIXED') NOT NULL DEFAULT 'PERCENTAGE',
    ADD COLUMN `serviceFeeValue` DECIMAL(10, 4) NOT NULL DEFAULT 5,
    ADD COLUMN `dynamicServiceFee` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `minimumProfitPerOrderCents` INT NOT NULL DEFAULT 100,
    ADD COLUMN `chargebackProtectionEnabled` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `automaticPayoutsEnabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `defaultVatPercent` DECIMAL(5, 2) NOT NULL DEFAULT 23;

UPDATE `FinancialSettings` SET
    `serviceFeeValue` = `platformCommissionPercent`,
    `reserveFundPercent` = 5,
    `minWithdrawalCents` = 2000,
    `pendingReleaseDays` = 3
WHERE `id` = 'default';

-- Promoter financial settings
CREATE TABLE `PromoterFinancialSettings` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `serviceFeeMode` ENUM('PERCENTAGE', 'FIXED') NULL,
    `serviceFeeValue` DECIMAL(10, 4) NULL,
    `reservePercentage` DECIMAL(5, 2) NULL,
    `minimumProfitPerOrderCents` INT NULL,
    `payoutDelayDays` INT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `PromoterFinancialSettings_organizationId_key`(`organizationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `PromoterFinancialSettings` ADD CONSTRAINT `PromoterFinancialSettings_organizationId_fkey`
    FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Wallet transactions (audit trail with balance snapshots)
CREATE TABLE `wallet_transactions` (
    `id` VARCHAR(191) NOT NULL,
    `walletId` VARCHAR(191) NOT NULL,
    `ledgerTransactionId` VARCHAR(191) NULL,
    `type` ENUM('TICKET_SALE', 'SERVICE_FEE', 'PAYMENT_GATEWAY_FEE', 'COMMISSION', 'RESERVE_HOLD', 'RESERVE_RELEASE', 'REFUND', 'WITHDRAWAL', 'WITHDRAWAL_FEE', 'CHARGEBACK', 'MANUAL_ADJUSTMENT', 'PAYOUT', 'PAYOUT_REVERSAL', 'BALANCE_RELEASE') NOT NULL,
    `amountCents` INT NOT NULL,
    `balanceBucket` ENUM('PENDING', 'AVAILABLE', 'WITHDRAWN') NOT NULL,
    `balanceBeforeCents` INT NOT NULL,
    `balanceAfterCents` INT NOT NULL,
    `referenceType` VARCHAR(64) NULL,
    `referenceId` VARCHAR(64) NULL,
    `description` VARCHAR(512) NULL,
    `metadata` JSON NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `wallet_transactions_walletId_createdAt_idx`(`walletId`, `createdAt`),
    INDEX `wallet_transactions_referenceType_referenceId_idx`(`referenceType`, `referenceId`),
    INDEX `wallet_transactions_ledgerTransactionId_idx`(`ledgerTransactionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `wallet_transactions` ADD CONSTRAINT `wallet_transactions_walletId_fkey`
    FOREIGN KEY (`walletId`) REFERENCES `Wallet`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `wallet_transactions` ADD CONSTRAINT `wallet_transactions_ledgerTransactionId_fkey`
    FOREIGN KEY (`ledgerTransactionId`) REFERENCES `LedgerTransaction`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Order breakdown extensions
ALTER TABLE `OrderFinancialBreakdown`
    ADD COLUMN `serviceFeeCents` INT NOT NULL DEFAULT 0,
    ADD COLUMN `gatewayFeeCents` INT NOT NULL DEFAULT 0,
    ADD COLUMN `netPlatformProfitCents` INT NOT NULL DEFAULT 0,
    ADD COLUMN `vatCents` INT NOT NULL DEFAULT 0,
    ADD COLUMN `paymentMethodCode` VARCHAR(32) NULL,
    ADD COLUMN `marginPercent` DECIMAL(5, 2) NULL;

-- Withdrawals IBAN
ALTER TABLE `WithdrawalRequest` ADD COLUMN `iban` VARCHAR(34) NULL;

-- Refunds ticket link
ALTER TABLE `Refund` ADD COLUMN `ticketId` VARCHAR(191) NULL;

-- Cost center
CREATE TABLE `FinanceCostCategory` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(128) NOT NULL,
    `type` ENUM('GATEWAY_FEES', 'INFRASTRUCTURE', 'MARKETING', 'HR', 'EXTERNAL_SERVICES', 'CHARGEBACKS', 'REFUNDS', 'OTHER') NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `FinanceCostCategory_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `FinanceCostEntry` (
    `id` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NULL,
    `eventId` VARCHAR(191) NULL,
    `amountCents` INT NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'EUR',
    `description` VARCHAR(512) NULL,
    `recordedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deletedAt` DATETIME(3) NULL,
    INDEX `FinanceCostEntry_categoryId_idx`(`categoryId`),
    INDEX `FinanceCostEntry_organizationId_idx`(`organizationId`),
    INDEX `FinanceCostEntry_eventId_idx`(`eventId`),
    INDEX `FinanceCostEntry_recordedAt_idx`(`recordedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `FinanceCostEntry` ADD CONSTRAINT `FinanceCostEntry_categoryId_fkey`
    FOREIGN KEY (`categoryId`) REFERENCES `FinanceCostCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `FinanceCostEntry` ADD CONSTRAINT `FinanceCostEntry_organizationId_fkey`
    FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO `FinanceCostCategory` (`id`, `name`, `type`) VALUES
(UUID(), 'Taxas Gateway', 'GATEWAY_FEES'),
(UUID(), 'Infraestrutura', 'INFRASTRUCTURE'),
(UUID(), 'Marketing', 'MARKETING'),
(UUID(), 'Recursos Humanos', 'HR'),
(UUID(), 'Serviços Externos', 'EXTERNAL_SERVICES'),
(UUID(), 'Chargebacks', 'CHARGEBACKS'),
(UUID(), 'Reembolsos', 'REFUNDS');

-- Chargeback evidence
ALTER TABLE `Chargeback` ADD COLUMN `evidence` JSON NULL;
