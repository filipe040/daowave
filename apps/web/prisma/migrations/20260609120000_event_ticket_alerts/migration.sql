-- Pré-registo / alerta de bilhetes disponíveis

ALTER TABLE `Event` ADD COLUMN `presaveEnabled` BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE `event_ticket_alerts` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `email` VARCHAR(320) NOT NULL,
    `name` VARCHAR(128) NULL,
    `userId` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'NOTIFIED', 'UNSUBSCRIBED') NOT NULL DEFAULT 'PENDING',
    `notifiedAt` DATETIME(3) NULL,
    `unsubscribeToken` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `event_ticket_alerts_unsubscribeToken_key`(`unsubscribeToken`),
    UNIQUE INDEX `event_ticket_alerts_eventId_email_key`(`eventId`, `email`),
    INDEX `event_ticket_alerts_eventId_status_idx`(`eventId`, `status`),
    INDEX `event_ticket_alerts_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `event_ticket_alerts` ADD CONSTRAINT `event_ticket_alerts_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `event_ticket_alerts` ADD CONSTRAINT `event_ticket_alerts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- EmailJobType enum extension
ALTER TABLE `EmailJobLog` MODIFY `type` ENUM('VERIFY_EMAIL', 'ORG_INVITE', 'PURCHASE_CONFIRMATION', 'EVENT_REMINDER_24H', 'POST_EVENT_THANKYOU', 'PROMOTER_DAILY_REPORT', 'TICKETS_AVAILABLE') NOT NULL;
