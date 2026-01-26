/*
  Warnings:

  - The values [ARCHIVED] on the enum `EventStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `details` on the `EmailLog` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `postalCode` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `publishedAt` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `approvedAt` on the `OrganizerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `nif` on the `OrganizerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `rejectedAt` on the `OrganizerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `rejectionReason` on the `OrganizerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `OrganizerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `TicketLot` table. All the data in the column will be lost.
  - You are about to drop the column `isComplimentary` on the `TicketType` table. All the data in the column will be lost.
  - You are about to drop the column `maxPerOrder` on the `TicketType` table. All the data in the column will be lost.
  - You are about to drop the `TicketTemplate` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[emailVerificationToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[passwordResetToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EventStatus_new" AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED');
ALTER TABLE "Event" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Event" ALTER COLUMN "status" TYPE "EventStatus_new" USING ("status"::text::"EventStatus_new");
ALTER TYPE "EventStatus" RENAME TO "EventStatus_old";
ALTER TYPE "EventStatus_new" RENAME TO "EventStatus";
DROP TYPE "EventStatus_old";
ALTER TABLE "Event" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- DropForeignKey
ALTER TABLE "TicketTemplate" DROP CONSTRAINT "TicketTemplate_organizerId_fkey";

-- DropIndex
DROP INDEX "Event_city_idx";

-- DropIndex
DROP INDEX "Event_startAt_idx";

-- DropIndex
DROP INDEX "TicketLot_isActive_startsAt_endsAt_idx";

-- AlterTable
ALTER TABLE "EmailLog" DROP COLUMN "details",
ADD COLUMN     "errorCode" TEXT,
ADD COLUMN     "meta" JSONB,
ADD COLUMN     "relatedUserId" TEXT,
ADD COLUMN     "toHash" TEXT;

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "country",
DROP COLUMN "latitude",
DROP COLUMN "longitude",
DROP COLUMN "postalCode",
DROP COLUMN "publishedAt";

-- AlterTable
ALTER TABLE "OrganizerProfile" DROP COLUMN "approvedAt",
DROP COLUMN "nif",
DROP COLUMN "rejectedAt",
DROP COLUMN "rejectionReason",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "TicketLot" DROP COLUMN "isActive";

-- AlterTable
ALTER TABLE "TicketType" DROP COLUMN "isComplimentary",
DROP COLUMN "maxPerOrder";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerificationToken" TEXT,
ADD COLUMN     "emailVerificationTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passwordResetToken" TEXT,
ADD COLUMN     "passwordResetTokenExpiresAt" TIMESTAMP(3);

-- DropTable
DROP TABLE "TicketTemplate";

-- CreateIndex
CREATE INDEX "Coupon_eventId_code_idx" ON "Coupon"("eventId", "code");

-- CreateIndex
CREATE INDEX "EmailLog_toHash_idx" ON "EmailLog"("toHash");

-- CreateIndex
CREATE INDEX "EmailLog_relatedUserId_idx" ON "EmailLog"("relatedUserId");

-- CreateIndex
CREATE UNIQUE INDEX "User_emailVerificationToken_key" ON "User"("emailVerificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_passwordResetToken_key" ON "User"("passwordResetToken");

-- CreateIndex
CREATE INDEX "User_emailVerificationToken_idx" ON "User"("emailVerificationToken");

-- CreateIndex
CREATE INDEX "User_passwordResetToken_idx" ON "User"("passwordResetToken");
