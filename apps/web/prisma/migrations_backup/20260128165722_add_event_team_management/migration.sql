-- CreateTable
CREATE TABLE `EventTeamMember` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'ORGANIZER', 'MANAGER', 'STAFF', 'VIEWER') NOT NULL DEFAULT 'STAFF',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isVolunteer` BOOLEAN NOT NULL DEFAULT false,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastAccessAt` DATETIME(3) NULL,

    INDEX `EventTeamMember_eventId_idx`(`eventId`),
    INDEX `EventTeamMember_userId_idx`(`userId`),
    INDEX `EventTeamMember_role_idx`(`role`),
    INDEX `EventTeamMember_isActive_idx`(`isActive`),
    UNIQUE INDEX `EventTeamMember_eventId_userId_key`(`eventId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EventTeamMemberPermission` (
    `id` VARCHAR(191) NOT NULL,
    `memberId` VARCHAR(191) NOT NULL,
    `permission` ENUM('CREATE_EVENTS', 'SELL_TICKETS', 'VALIDATE_ENTRIES', 'VIEW_REPORTS', 'MANAGE_TEAMS') NOT NULL,

    INDEX `EventTeamMemberPermission_memberId_idx`(`memberId`),
    INDEX `EventTeamMemberPermission_permission_idx`(`permission`),
    UNIQUE INDEX `EventTeamMemberPermission_memberId_permission_key`(`memberId`, `permission`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `EventTeamMember` ADD CONSTRAINT `EventTeamMember_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventTeamMember` ADD CONSTRAINT `EventTeamMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventTeamMemberPermission` ADD CONSTRAINT `EventTeamMemberPermission_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `EventTeamMember`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
