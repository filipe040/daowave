-- AlterTable
ALTER TABLE `Ticket` ADD COLUMN `seatId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `TicketLot` ADD COLUMN `capacity` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `endsAt` DATETIME(3) NULL,
    ADD COLUMN `perUserLimit` INTEGER NULL,
    ADD COLUMN `soldCount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `startsAt` DATETIME(3) NULL,
    ADD COLUMN `status` ENUM('ACTIVE', 'PAUSED', 'SOLD_OUT', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN `ticketTypeId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `TicketType` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'PAUSED', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    `perUserLimit` INTEGER NULL,
    `requiresSeat` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TicketType_eventId_idx`(`eventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InventoryHold` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `ticketLotId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `qty` INTEGER NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `status` ENUM('ACTIVE', 'RELEASED', 'CONVERTED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `InventoryHold_eventId_idx`(`eventId`),
    INDEX `InventoryHold_ticketLotId_idx`(`ticketLotId`),
    INDEX `InventoryHold_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SeatMap` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('THEATER', 'TABLES') NOT NULL DEFAULT 'THEATER',
    `version` INTEGER NOT NULL DEFAULT 1,
    `publishedAt` DATETIME(3) NULL,
    `configJson` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SeatMap_eventId_idx`(`eventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Seat` (
    `id` VARCHAR(191) NOT NULL,
    `seatMapId` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `ticketTypeId` VARCHAR(191) NULL,
    `section` VARCHAR(191) NOT NULL,
    `row` VARCHAR(191) NOT NULL,
    `number` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NULL,
    `status` ENUM('AVAILABLE', 'SOLD', 'BLOCKED') NOT NULL DEFAULT 'AVAILABLE',

    INDEX `Seat_eventId_idx`(`eventId`),
    INDEX `Seat_ticketTypeId_idx`(`ticketTypeId`),
    UNIQUE INDEX `Seat_seatMapId_section_row_number_key`(`seatMapId`, `section`, `row`, `number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SeatHold` (
    `id` VARCHAR(191) NOT NULL,
    `seatId` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `status` ENUM('ACTIVE', 'RELEASED', 'CONVERTED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SeatHold_seatId_idx`(`seatId`),
    INDEX `SeatHold_eventId_idx`(`eventId`),
    INDEX `SeatHold_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `TicketLot_ticketTypeId_idx` ON `TicketLot`(`ticketTypeId`);

-- AddForeignKey
ALTER TABLE `TicketLot` ADD CONSTRAINT `TicketLot_ticketTypeId_fkey` FOREIGN KEY (`ticketTypeId`) REFERENCES `TicketType`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TicketType` ADD CONSTRAINT `TicketType_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryHold` ADD CONSTRAINT `InventoryHold_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryHold` ADD CONSTRAINT `InventoryHold_ticketLotId_fkey` FOREIGN KEY (`ticketLotId`) REFERENCES `TicketLot`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SeatMap` ADD CONSTRAINT `SeatMap_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Seat` ADD CONSTRAINT `Seat_seatMapId_fkey` FOREIGN KEY (`seatMapId`) REFERENCES `SeatMap`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Seat` ADD CONSTRAINT `Seat_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Seat` ADD CONSTRAINT `Seat_ticketTypeId_fkey` FOREIGN KEY (`ticketTypeId`) REFERENCES `TicketType`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SeatHold` ADD CONSTRAINT `SeatHold_seatId_fkey` FOREIGN KEY (`seatId`) REFERENCES `Seat`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SeatHold` ADD CONSTRAINT `SeatHold_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ticket` ADD CONSTRAINT `Ticket_seatId_fkey` FOREIGN KEY (`seatId`) REFERENCES `Seat`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
