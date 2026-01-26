-- AlterTable: Add new fields to EmailLog
ALTER TABLE "EmailLog" ADD COLUMN "type" TEXT;
ALTER TABLE "EmailLog" ADD COLUMN "providerMessageId" TEXT;
ALTER TABLE "EmailLog" ADD COLUMN "relatedOrderId" TEXT;
ALTER TABLE "EmailLog" ADD COLUMN "relatedTicketId" TEXT;

-- Update existing rows to have a default type
UPDATE "EmailLog" SET "type" = COALESCE("template", 'unknown') WHERE "type" IS NULL;

-- Make type required (after setting defaults)
ALTER TABLE "EmailLog" ALTER COLUMN "type" SET NOT NULL;

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS "EmailLog_type_relatedOrderId_idx" ON "EmailLog"("type", "relatedOrderId");
CREATE INDEX IF NOT EXISTS "EmailLog_type_relatedTicketId_idx" ON "EmailLog"("type", "relatedTicketId");
CREATE INDEX IF NOT EXISTS "EmailLog_providerMessageId_idx" ON "EmailLog"("providerMessageId");

-- Update status enum values (add BLOCKED and DISABLED)
-- Note: PostgreSQL doesn't support ALTER TYPE ADD VALUE in a transaction, so we'll handle this separately if needed
-- For now, we'll use TEXT type which allows any value

