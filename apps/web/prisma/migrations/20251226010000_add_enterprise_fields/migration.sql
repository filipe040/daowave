-- Add missing fields to OrganizerProfile
ALTER TABLE "OrganizerProfile" 
  ADD COLUMN IF NOT EXISTS "nif" TEXT,
  ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT,
  ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "rejectedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add missing fields to Event
ALTER TABLE "Event"
  ADD COLUMN IF NOT EXISTS "postalCode" TEXT,
  ADD COLUMN IF NOT EXISTS "country" TEXT DEFAULT 'Portugal',
  ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "checkinMode" "CheckinMode" DEFAULT 'SINGLE',
  ADD COLUMN IF NOT EXISTS "maxEntries" INTEGER;

-- Update EventStatus enum to include ARCHIVED
DO $$ BEGIN
  -- Drop default first
  ALTER TABLE "Event" ALTER COLUMN "status" DROP DEFAULT;
  
  -- Create new enum
  CREATE TYPE "EventStatus_new" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED', 'CANCELLED');
  
  -- Convert column
  ALTER TABLE "Event" ALTER COLUMN "status" TYPE "EventStatus_new" USING ("status"::text::"EventStatus_new");
  
  -- Drop old enum and rename new one
  DROP TYPE "EventStatus";
  ALTER TYPE "EventStatus_new" RENAME TO "EventStatus";
  
  -- Restore default
  ALTER TABLE "Event" ALTER COLUMN "status" SET DEFAULT 'DRAFT'::"EventStatus";
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add missing fields to TicketType
ALTER TABLE "TicketType"
  ADD COLUMN IF NOT EXISTS "maxPerOrder" INTEGER,
  ADD COLUMN IF NOT EXISTS "isComplimentary" BOOLEAN DEFAULT false;

-- Add missing fields to TicketLot
ALTER TABLE "TicketLot"
  ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;

-- Add missing fields to Order
ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "couponCode" TEXT,
  ADD COLUMN IF NOT EXISTS "discountAmount" INTEGER DEFAULT 0;

-- Create Coupon table
CREATE TABLE IF NOT EXISTS "Coupon" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discountType" TEXT NOT NULL,
    "discountValue" INTEGER NOT NULL,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- Create TicketTemplate table
CREATE TABLE IF NOT EXISTS "TicketTemplate" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "htmlTemplate" TEXT NOT NULL,
    "cssStyles" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketTemplate_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "Coupon_code_isActive_idx" ON "Coupon"("code", "isActive");
CREATE INDEX IF NOT EXISTS "Coupon_eventId_idx" ON "Coupon"("eventId");
CREATE UNIQUE INDEX IF NOT EXISTS "Coupon_code_key" ON "Coupon"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "TicketTemplate_organizerId_version_key" ON "TicketTemplate"("organizerId", "version");
CREATE INDEX IF NOT EXISTS "TicketTemplate_organizerId_isActive_idx" ON "TicketTemplate"("organizerId", "isActive");
CREATE INDEX IF NOT EXISTS "Event_city_idx" ON "Event"("city");
CREATE INDEX IF NOT EXISTS "Event_startAt_idx" ON "Event"("startAt");
CREATE INDEX IF NOT EXISTS "TicketLot_isActive_startsAt_endsAt_idx" ON "TicketLot"("isActive", "startsAt", "endsAt");
CREATE INDEX IF NOT EXISTS "Order_couponCode_idx" ON "Order"("couponCode");

-- Add foreign keys
DO $$ BEGIN
  ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "TicketTemplate" ADD CONSTRAINT "TicketTemplate_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "OrganizerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "Order" ADD CONSTRAINT "Order_couponCode_fkey" FOREIGN KEY ("couponCode") REFERENCES "Coupon"("code") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

