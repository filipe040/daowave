-- LivePass Financial System: Wallets, Ledger, Withdrawals, Refunds

-- FinancialSettings (singleton)
CREATE TABLE `FinancialSettings` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'default',
    `buyerFeePercent` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `buyerFeeFixedCents` INTEGER NOT NULL DEFAULT 0,
    `platformCommissionPercent` DECIMAL(5, 2) NOT NULL DEFAULT 5,
    `reserveFundPercent` DECIMAL(5, 2) NOT NULL DEFAULT 2,
    `minWithdrawalCents` INTEGER NOT NULL DEFAULT 5000,
    `pendingReleaseDays` INTEGER NOT NULL DEFAULT 7,
    `autoApproveWithdrawals` BOOLEAN NOT NULL DEFAULT false,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'EUR',
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedByUserId` VARCHAR(191) NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `FinancialSettings` (`id`, `updatedAt`) VALUES ('default', NOW(3));

-- Wallet
CREATE TABLE `Wallet` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `type` ENUM('PLATFORM', 'PROMOTER', 'RESERVE') NOT NULL,
    `organizationId` VARCHAR(191) NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'EUR',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `Wallet_code_key`(`code`),
    UNIQUE INDEX `Wallet_organizationId_key`(`organizationId`),
    INDEX `Wallet_type_idx`(`type`),
    INDEX `Wallet_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- LedgerTransaction
CREATE TABLE `LedgerTransaction` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('ORDER_PAYMENT', 'REFUND', 'WITHDRAWAL', 'RESERVE_ALLOCATION', 'RESERVE_RELEASE', 'BALANCE_RELEASE', 'CHARGEBACK', 'ADJUSTMENT', 'FEE') NOT NULL,
    `status` ENUM('PENDING', 'COMPLETED', 'REVERSED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `idempotencyKey` VARCHAR(191) NULL,
    `description` VARCHAR(512) NULL,
    `amountCents` INTEGER NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'EUR',
    `referenceType` VARCHAR(64) NULL,
    `referenceId` VARCHAR(64) NULL,
    `orderId` VARCHAR(191) NULL,
    `organizationId` VARCHAR(191) NULL,
    `paymentProvider` ENUM('STRIPE', 'EUPAGO', 'MBWAY', 'MULTIBANCO', 'PAYPAL', 'MANUAL') NULL,
    `metadata` JSON NULL,
    `reversedById` VARCHAR(191) NULL,
    `completedAt` DATETIME(3) NULL,
    `reversedAt` DATETIME(3) NULL,
    `balanceReleasedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `LedgerTransaction_idempotencyKey_key`(`idempotencyKey`),
    UNIQUE INDEX `LedgerTransaction_reversedById_key`(`reversedById`),
    INDEX `LedgerTransaction_type_status_idx`(`type`, `status`),
    INDEX `LedgerTransaction_orderId_idx`(`orderId`),
    INDEX `LedgerTransaction_organizationId_idx`(`organizationId`),
    INDEX `LedgerTransaction_referenceType_referenceId_idx`(`referenceType`, `referenceId`),
    INDEX `LedgerTransaction_createdAt_idx`(`createdAt`),
    INDEX `LedgerTransaction_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- LedgerEntry
CREATE TABLE `LedgerEntry` (
    `id` VARCHAR(191) NOT NULL,
    `transactionId` VARCHAR(191) NOT NULL,
    `walletId` VARCHAR(191) NOT NULL,
    `direction` ENUM('CREDIT', 'DEBIT') NOT NULL,
    `balanceBucket` ENUM('PENDING', 'AVAILABLE', 'WITHDRAWN') NOT NULL,
    `amountCents` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `LedgerEntry_transactionId_idx`(`transactionId`),
    INDEX `LedgerEntry_walletId_balanceBucket_idx`(`walletId`, `balanceBucket`),
    INDEX `LedgerEntry_walletId_createdAt_idx`(`walletId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- OrderFinancialBreakdown
CREATE TABLE `OrderFinancialBreakdown` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `ledgerTransactionId` VARCHAR(191) NOT NULL,
    `subtotalCents` INTEGER NOT NULL,
    `buyerFeeCents` INTEGER NOT NULL,
    `platformFeeCents` INTEGER NOT NULL,
    `reserveCents` INTEGER NOT NULL,
    `promoterNetCents` INTEGER NOT NULL,
    `totalCents` INTEGER NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'EUR',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `OrderFinancialBreakdown_orderId_key`(`orderId`),
    UNIQUE INDEX `OrderFinancialBreakdown_ledgerTransactionId_key`(`ledgerTransactionId`),
    INDEX `OrderFinancialBreakdown_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- WithdrawalRequest
CREATE TABLE `WithdrawalRequest` (
    `id` VARCHAR(191) NOT NULL,
    `walletId` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `amountCents` INTEGER NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'EUR',
    `status` ENUM('PENDING', 'APPROVED', 'PROCESSING', 'PAID', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `bankDetails` JSON NULL,
    `ledgerTransactionId` VARCHAR(191) NULL,
    `approvedByUserId` VARCHAR(191) NULL,
    `rejectedReason` VARCHAR(512) NULL,
    `autoApproved` BOOLEAN NOT NULL DEFAULT false,
    `paidAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `WithdrawalRequest_ledgerTransactionId_key`(`ledgerTransactionId`),
    INDEX `WithdrawalRequest_organizationId_status_idx`(`organizationId`, `status`),
    INDEX `WithdrawalRequest_status_idx`(`status`),
    INDEX `WithdrawalRequest_createdAt_idx`(`createdAt`),
    INDEX `WithdrawalRequest_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Refund
CREATE TABLE `Refund` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `amountCents` INTEGER NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'EUR',
    `reason` VARCHAR(512) NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `ledgerTransactionId` VARCHAR(191) NULL,
    `initiatedByUserId` VARCHAR(191) NULL,
    `processedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `Refund_ledgerTransactionId_key`(`ledgerTransactionId`),
    INDEX `Refund_orderId_idx`(`orderId`),
    INDEX `Refund_status_idx`(`status`),
    INDEX `Refund_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Chargeback
CREATE TABLE `Chargeback` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `paymentId` VARCHAR(191) NULL,
    `amountCents` INTEGER NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'EUR',
    `provider` ENUM('STRIPE', 'EUPAGO', 'MBWAY', 'MULTIBANCO', 'PAYPAL', 'MANUAL') NOT NULL,
    `providerReference` VARCHAR(128) NULL,
    `status` ENUM('OPEN', 'WON', 'LOST', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    `ledgerTransactionId` VARCHAR(191) NULL,
    `reason` VARCHAR(512) NULL,
    `resolvedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `Chargeback_ledgerTransactionId_key`(`ledgerTransactionId`),
    INDEX `Chargeback_orderId_idx`(`orderId`),
    INDEX `Chargeback_status_idx`(`status`),
    INDEX `Chargeback_provider_providerReference_idx`(`provider`, `providerReference`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- FinancialAuditLog
CREATE TABLE `FinancialAuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `actorUserId` VARCHAR(191) NULL,
    `action` VARCHAR(128) NOT NULL,
    `entityType` VARCHAR(64) NOT NULL,
    `entityId` VARCHAR(64) NULL,
    `transactionId` VARCHAR(191) NULL,
    `beforeJson` JSON NULL,
    `afterJson` JSON NULL,
    `ip` VARCHAR(45) NULL,
    `userAgent` VARCHAR(512) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `FinancialAuditLog_actorUserId_idx`(`actorUserId`),
    INDEX `FinancialAuditLog_entityType_entityId_idx`(`entityType`, `entityId`),
    INDEX `FinancialAuditLog_transactionId_idx`(`transactionId`),
    INDEX `FinancialAuditLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- PaymentProviderConfig
CREATE TABLE `PaymentProviderConfig` (
    `id` VARCHAR(191) NOT NULL,
    `provider` ENUM('STRIPE', 'EUPAGO', 'MBWAY', 'MULTIBANCO', 'PAYPAL', 'MANUAL') NOT NULL,
    `isEnabled` BOOLEAN NOT NULL DEFAULT false,
    `displayName` VARCHAR(64) NOT NULL,
    `configJson` JSON NULL,
    `webhookSecret` VARCHAR(256) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `PaymentProviderConfig_provider_key`(`provider`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `PaymentProviderConfig` (`id`, `provider`, `isEnabled`, `displayName`, `updatedAt`) VALUES
(UUID(), 'STRIPE', false, 'Stripe', NOW(3)),
(UUID(), 'EUPAGO', false, 'EuPago', NOW(3)),
(UUID(), 'MBWAY', false, 'MB Way', NOW(3)),
(UUID(), 'MULTIBANCO', false, 'Multibanco', NOW(3)),
(UUID(), 'PAYPAL', false, 'PayPal', NOW(3)),
(UUID(), 'MANUAL', true, 'Manual / POS', NOW(3));

-- Platform & reserve wallets
INSERT INTO `Wallet` (`id`, `code`, `type`, `organizationId`, `updatedAt`) VALUES
(UUID(), 'platform', 'PLATFORM', NULL, NOW(3)),
(UUID(), 'reserve', 'RESERVE', NULL, NOW(3));

-- Foreign keys
ALTER TABLE `Wallet` ADD CONSTRAINT `Wallet_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `LedgerTransaction` ADD CONSTRAINT `LedgerTransaction_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `LedgerTransaction` ADD CONSTRAINT `LedgerTransaction_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `LedgerTransaction` ADD CONSTRAINT `LedgerTransaction_reversedById_fkey` FOREIGN KEY (`reversedById`) REFERENCES `LedgerTransaction`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `LedgerEntry` ADD CONSTRAINT `LedgerEntry_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `LedgerTransaction`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `LedgerEntry` ADD CONSTRAINT `LedgerEntry_walletId_fkey` FOREIGN KEY (`walletId`) REFERENCES `Wallet`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `OrderFinancialBreakdown` ADD CONSTRAINT `OrderFinancialBreakdown_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `OrderFinancialBreakdown` ADD CONSTRAINT `OrderFinancialBreakdown_ledgerTransactionId_fkey` FOREIGN KEY (`ledgerTransactionId`) REFERENCES `LedgerTransaction`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `WithdrawalRequest` ADD CONSTRAINT `WithdrawalRequest_walletId_fkey` FOREIGN KEY (`walletId`) REFERENCES `Wallet`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `WithdrawalRequest` ADD CONSTRAINT `WithdrawalRequest_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `WithdrawalRequest` ADD CONSTRAINT `WithdrawalRequest_ledgerTransactionId_fkey` FOREIGN KEY (`ledgerTransactionId`) REFERENCES `LedgerTransaction`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `Refund` ADD CONSTRAINT `Refund_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Refund` ADD CONSTRAINT `Refund_ledgerTransactionId_fkey` FOREIGN KEY (`ledgerTransactionId`) REFERENCES `LedgerTransaction`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `Chargeback` ADD CONSTRAINT `Chargeback_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Chargeback` ADD CONSTRAINT `Chargeback_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `Payment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Chargeback` ADD CONSTRAINT `Chargeback_ledgerTransactionId_fkey` FOREIGN KEY (`ledgerTransactionId`) REFERENCES `LedgerTransaction`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `FinancialAuditLog` ADD CONSTRAINT `FinancialAuditLog_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `LedgerTransaction`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
