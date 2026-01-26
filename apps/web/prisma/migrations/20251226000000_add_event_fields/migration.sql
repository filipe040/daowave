-- AlterTable
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "category" TEXT,
ADD COLUMN IF NOT EXISTS "timezone" TEXT DEFAULT 'Europe/Lisbon',
ADD COLUMN IF NOT EXISTS "galleryUrls" JSONB,
ADD COLUMN IF NOT EXISTS "reentryAllowed" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "entryWindowStartAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "entryWindowEndAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "capacityTotal" INTEGER,
ADD COLUMN IF NOT EXISTS "ageRestriction" INTEGER,
ADD COLUMN IF NOT EXISTS "refundPolicy" TEXT,
ADD COLUMN IF NOT EXISTS "cancellationPolicy" TEXT,
ADD COLUMN IF NOT EXISTS "termsText" TEXT,
ADD COLUMN IF NOT EXISTS "consentRGPD" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "wheelchairAccess" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "signLanguageSupport" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "accessibleWC" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "accessibilityNotes" TEXT,
ADD COLUMN IF NOT EXISTS "contactEmail" TEXT,
ADD COLUMN IF NOT EXISTS "contactPhone" TEXT,
ADD COLUMN IF NOT EXISTS "supportInstructions" TEXT,
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Update existing events with default values
UPDATE "Event" SET 
  "timezone" = 'Europe/Lisbon',
  "reentryAllowed" = false,
  "consentRGPD" = false,
  "wheelchairAccess" = false,
  "signLanguageSupport" = false,
  "accessibleWC" = false,
  "contactEmail" = COALESCE("contactEmail", 'contacto@exemplo.pt')
WHERE "timezone" IS NULL;

-- Set contactEmail for existing events if null
UPDATE "Event" SET "contactEmail" = 'contacto@exemplo.pt' WHERE "contactEmail" IS NULL;

-- AlterTable: Update OrganizerProfile status to use enum
-- First, create the enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE "OrganizerStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Drop default first
ALTER TABLE "OrganizerProfile" ALTER COLUMN "status" DROP DEFAULT;

-- Convert status column to enum
ALTER TABLE "OrganizerProfile" 
  ALTER COLUMN "status" TYPE "OrganizerStatus" USING (
    CASE 
      WHEN "status"::text = 'APPROVED' THEN 'APPROVED'::"OrganizerStatus"
      WHEN "status"::text = 'REJECTED' THEN 'REJECTED'::"OrganizerStatus"
      ELSE 'PENDING'::"OrganizerStatus"
    END
  );

-- Set default after conversion
ALTER TABLE "OrganizerProfile" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"OrganizerStatus";

