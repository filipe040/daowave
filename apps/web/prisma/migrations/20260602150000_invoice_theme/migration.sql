-- Personalização de faturas por organização e evento
ALTER TABLE "Organization" ADD COLUMN "invoiceThemeJson" JSONB;
ALTER TABLE "Event" ADD COLUMN "invoiceThemeJson" JSONB;
