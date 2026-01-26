-- CreateTable: BetaAllowlist
CREATE TABLE IF NOT EXISTS "BetaAllowlist" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BetaAllowlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "BetaAllowlist_email_key" ON "BetaAllowlist"("email");
CREATE INDEX IF NOT EXISTS "BetaAllowlist_email_enabled_idx" ON "BetaAllowlist"("email", "enabled");

