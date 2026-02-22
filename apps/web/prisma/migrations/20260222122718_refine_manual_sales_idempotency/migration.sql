/*
  Warnings:

  - You are about to alter the column `method` on the `ManualPayment` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(13))`.
  - A unique constraint covering the columns `[idempotencyKey]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `ManualPayment` ADD COLUMN `customerEmail` VARCHAR(191) NULL,
    ADD COLUMN `customerName` VARCHAR(191) NULL,
    ADD COLUMN `customerPhone` VARCHAR(191) NULL,
    MODIFY `method` ENUM('MBWAY', 'CASH', 'BANK', 'OTHER') NOT NULL;

-- AlterTable
ALTER TABLE `Order` ADD COLUMN `idempotencyKey` VARCHAR(191) NULL,
    MODIFY `status` ENUM('PENDING', 'PAID', 'CANCELED', 'REFUNDED', 'PENDING_MANUAL', 'VOIDED') NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE UNIQUE INDEX `Order_idempotencyKey_key` ON `Order`(`idempotencyKey`);
