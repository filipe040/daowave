# E2E Tests

- **Prerequisite:** Run `npm run e2e:prep` from `apps/web` (runs `prisma migrate deploy` + `db:seed`). E2E assumes the DB is already seeded.
- **globalSetup** verifies the DB has seed data and writes `tests/e2e/.cache/seed.json` with `{ eventId, eventSlug: "evento-seed-1", validQr }` (one ticket with valid qrPayload for check-in tests). If event or valid ticket is missing, it fails with a clear message.
- **Checkout** navigates directly to `/events/evento-seed-1` (deterministic). Flow: event-ticket-selector → + → Continuar para Pagamento → wait `/api/checkout/create` OK → page-checkout → buyer name/email → Confirmar Pagamento.
- **Check-in** uses `eventId` and `validQr` from `seed.json`: first scan expects VALID (e.g. "checked in successfully"), second scan of same QR expects ALREADY_USED (e.g. "already checked in"). Uses `data-testid`: page-promotor-checkin, input-qr, checkin-result.
- **Credentials:** Use env vars `E2E_PROMOTER_EMAIL`, `E2E_PROMOTER_PASSWORD`, `E2E_VALIDATOR_EMAIL`, `E2E_VALIDATOR_PASSWORD`, `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`, or rely on seed fallbacks (e.g. promotor@seed.pt / comprador1@seed.pt with password `TestPassword123!`).
- **Run:** `npm run e2e:prep && npm run test:e2e` for 10/10 tests.
