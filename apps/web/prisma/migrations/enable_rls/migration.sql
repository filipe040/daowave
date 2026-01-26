-- Enable Row Level Security (RLS) on all tables
-- This prevents unauthorized access via PostgREST while allowing Prisma Client access

-- Enable RLS on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrganizerProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Event" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TicketType" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TicketLot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Ticket" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TransferLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ValidatorAssignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CheckinLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Coupon" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EmailLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BetaAllowlist" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- Create policies that deny all public access via PostgREST
-- Prisma Client uses service role credentials and bypasses RLS
-- These policies only affect PostgREST API access

-- User table: Deny all public access
CREATE POLICY "Deny all public access" ON "User" FOR ALL USING (false);

-- OrganizerProfile table: Deny all public access
CREATE POLICY "Deny all public access" ON "OrganizerProfile" FOR ALL USING (false);

-- Event table: Deny all public access
CREATE POLICY "Deny all public access" ON "Event" FOR ALL USING (false);

-- TicketType table: Deny all public access
CREATE POLICY "Deny all public access" ON "TicketType" FOR ALL USING (false);

-- TicketLot table: Deny all public access
CREATE POLICY "Deny all public access" ON "TicketLot" FOR ALL USING (false);

-- Order table: Deny all public access
CREATE POLICY "Deny all public access" ON "Order" FOR ALL USING (false);

-- OrderItem table: Deny all public access
CREATE POLICY "Deny all public access" ON "OrderItem" FOR ALL USING (false);

-- Ticket table: Deny all public access
CREATE POLICY "Deny all public access" ON "Ticket" FOR ALL USING (false);

-- TransferLog table: Deny all public access
CREATE POLICY "Deny all public access" ON "TransferLog" FOR ALL USING (false);

-- ValidatorAssignment table: Deny all public access
CREATE POLICY "Deny all public access" ON "ValidatorAssignment" FOR ALL USING (false);

-- CheckinLog table: Deny all public access
CREATE POLICY "Deny all public access" ON "CheckinLog" FOR ALL USING (false);

-- Coupon table: Deny all public access
CREATE POLICY "Deny all public access" ON "Coupon" FOR ALL USING (false);

-- EmailLog table: Deny all public access
CREATE POLICY "Deny all public access" ON "EmailLog" FOR ALL USING (false);

-- BetaAllowlist table: Deny all public access
CREATE POLICY "Deny all public access" ON "BetaAllowlist" FOR ALL USING (false);

-- AuditLog table: Deny all public access
CREATE POLICY "Deny all public access" ON "AuditLog" FOR ALL USING (false);

-- Note: _prisma_migrations table is managed by Prisma and should remain accessible
-- It's safe to leave it without RLS as it only contains migration metadata
