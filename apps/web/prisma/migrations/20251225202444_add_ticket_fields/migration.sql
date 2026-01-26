-- Step 1: Add columns as nullable first
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "holderUserId" TEXT;
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "attendeeEmail" TEXT;
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "entriesUsed" INTEGER DEFAULT 0;
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "lastCheckinAt" TIMESTAMP(3);

-- Step 2: Update existing tickets with default values
-- Set holderUserId to the order's userId for existing tickets
UPDATE "Ticket" 
SET "holderUserId" = "Order"."userId"
FROM "Order"
WHERE "Ticket"."orderId" = "Order"."id" AND "Ticket"."holderUserId" IS NULL;

-- Set attendeeEmail from Order user email for existing tickets
UPDATE "Ticket" 
SET "attendeeEmail" = "User"."email"
FROM "Order"
JOIN "User" ON "Order"."userId" = "User"."id"
WHERE "Ticket"."orderId" = "Order"."id" AND "Ticket"."attendeeEmail" IS NULL;

-- Set attendeeName from Order user name or email for existing tickets
UPDATE "Ticket" 
SET "attendeeName" = COALESCE("User"."name", "User"."email")
FROM "Order"
JOIN "User" ON "Order"."userId" = "User"."id"
WHERE "Ticket"."orderId" = "Order"."id" AND "Ticket"."attendeeName" IS NULL;

-- Step 3: Remove old columns that are being replaced
ALTER TABLE "Ticket" DROP COLUMN IF EXISTS "checkinStatus";
ALTER TABLE "Ticket" DROP COLUMN IF EXISTS "checkinAt";
ALTER TABLE "Ticket" DROP COLUMN IF EXISTS "checkinByUserId";
ALTER TABLE "Ticket" DROP COLUMN IF EXISTS "checkinDeviceId";

-- Step 4: Now make columns NOT NULL
ALTER TABLE "Ticket" ALTER COLUMN "holderUserId" SET NOT NULL;
ALTER TABLE "Ticket" ALTER COLUMN "attendeeName" SET NOT NULL;
ALTER TABLE "Ticket" ALTER COLUMN "attendeeEmail" SET NOT NULL;
ALTER TABLE "Ticket" ALTER COLUMN "entriesUsed" SET NOT NULL;
ALTER TABLE "Ticket" ALTER COLUMN "entriesUsed" SET DEFAULT 0;

-- Step 5: Add foreign key constraint
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_holderUserId_fkey" FOREIGN KEY ("holderUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 6: Add indexes
CREATE INDEX IF NOT EXISTS "Ticket_holderUserId_idx" ON "Ticket"("holderUserId");
CREATE INDEX IF NOT EXISTS "Ticket_status_idx" ON "Ticket"("status");

-- Step 7: Add new enum values if they don't exist (they should already exist, but just in case)
DO $$ BEGIN
    CREATE TYPE "CheckinMode" AS ENUM ('SINGLE', 'MULTI');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 8: Add new columns to Event table if they don't exist
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "checkinMode" "CheckinMode" DEFAULT 'SINGLE';
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "maxEntries" INTEGER;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "checkinStartAt" TIMESTAMP(3);
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "checkinEndAt" TIMESTAMP(3);

-- Step 9: Update CheckinLog table with new columns
ALTER TABLE "CheckinLog" ADD COLUMN IF NOT EXISTS "offline" BOOLEAN DEFAULT false;
ALTER TABLE "CheckinLog" ADD COLUMN IF NOT EXISTS "syncedAt" TIMESTAMP(3);

-- Step 10: Create indexes for CheckinLog
CREATE INDEX IF NOT EXISTS "CheckinLog_validatorUserId_idx" ON "CheckinLog"("validatorUserId");
CREATE INDEX IF NOT EXISTS "CheckinLog_offline_syncedAt_idx" ON "CheckinLog"("offline", "syncedAt");

-- Step 11: Add new tables if they don't exist
CREATE TABLE IF NOT EXISTS "TransferLog" (
    "id" TEXT NOT NULL,
    "fromTicketId" TEXT NOT NULL,
    "toTicketId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "toEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransferLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ValidatorAssignment" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "validatorUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ValidatorAssignment_pkey" PRIMARY KEY ("id")
);

-- Step 12: Add unique constraints and indexes for new tables
CREATE UNIQUE INDEX IF NOT EXISTS "TransferLog_fromTicketId_key" ON "TransferLog"("fromTicketId");
CREATE UNIQUE INDEX IF NOT EXISTS "TransferLog_toTicketId_key" ON "TransferLog"("toTicketId");
CREATE INDEX IF NOT EXISTS "TransferLog_fromUserId_idx" ON "TransferLog"("fromUserId");
CREATE INDEX IF NOT EXISTS "TransferLog_toUserId_idx" ON "TransferLog"("toUserId");

CREATE UNIQUE INDEX IF NOT EXISTS "ValidatorAssignment_eventId_validatorUserId_key" ON "ValidatorAssignment"("eventId", "validatorUserId");
CREATE INDEX IF NOT EXISTS "ValidatorAssignment_validatorUserId_idx" ON "ValidatorAssignment"("validatorUserId");

-- Step 13: Add foreign keys for new tables
DO $$ BEGIN
    ALTER TABLE "TransferLog" ADD CONSTRAINT "TransferLog_fromTicketId_fkey" FOREIGN KEY ("fromTicketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "TransferLog" ADD CONSTRAINT "TransferLog_toTicketId_fkey" FOREIGN KEY ("toTicketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "TransferLog" ADD CONSTRAINT "TransferLog_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "TransferLog" ADD CONSTRAINT "TransferLog_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "ValidatorAssignment" ADD CONSTRAINT "ValidatorAssignment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "ValidatorAssignment" ADD CONSTRAINT "ValidatorAssignment_validatorUserId_fkey" FOREIGN KEY ("validatorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 14: Update Order table to remove stripePaymentIntentId and add new columns
ALTER TABLE "Order" DROP COLUMN IF EXISTS "stripePaymentIntentId";
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentProvider" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentRef" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Order_paymentRef_idx" ON "Order"("paymentRef");

