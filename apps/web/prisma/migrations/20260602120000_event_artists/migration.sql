-- Event layout mode + artist-based ticketing
ALTER TABLE `Event` ADD COLUMN `layoutMode` ENUM('STANDARD', 'ARTISTS') NOT NULL DEFAULT 'STANDARD';

CREATE TABLE `EventArtist` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `imageUrl` VARCHAR(2048) NULL,
    `bio` TEXT NULL,
    `performanceAt` DATETIME(3) NOT NULL,
    `venue` VARCHAR(191) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `badgeLabel` VARCHAR(191) NULL,
    `isPublished` BOOLEAN NOT NULL DEFAULT true,
    `ticketTypeId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `EventArtist_ticketTypeId_key`(`ticketTypeId`),
    UNIQUE INDEX `EventArtist_eventId_slug_key`(`eventId`, `slug`),
    INDEX `EventArtist_eventId_idx`(`eventId`),
    INDEX `EventArtist_performanceAt_idx`(`performanceAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `EventArtist` ADD CONSTRAINT `EventArtist_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `EventArtist` ADD CONSTRAINT `EventArtist_ticketTypeId_fkey` FOREIGN KEY (`ticketTypeId`) REFERENCES `TicketType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
