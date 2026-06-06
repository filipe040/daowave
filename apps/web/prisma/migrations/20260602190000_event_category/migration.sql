-- AlterTable
ALTER TABLE `Event` ADD COLUMN `category` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Event_category_idx` ON `Event`(`category`);
