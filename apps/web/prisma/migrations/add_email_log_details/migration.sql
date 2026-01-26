-- AlterTable: Add details field to EmailLog for idempotency
ALTER TABLE "EmailLog" ADD COLUMN "details" JSONB;

-- CreateIndex: Index for idempotency checks
CREATE INDEX "EmailLog_template_status_idx" ON "EmailLog"("template", "status");

-- CreateIndex: Index for retry processing
CREATE INDEX "EmailLog_status_retryCount_idx" ON "EmailLog"("status", "retryCount");

