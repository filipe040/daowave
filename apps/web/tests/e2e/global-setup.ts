/**
 * E2E global setup: verify DB has seed data and write fixture for tests.
 * Does NOT run migrations or seed — run `npm run e2e:prep` before E2E.
 * Writes tests/e2e/.cache/seed.json with eventId, eventSlug, validQr for deterministic E2E.
 */
import * as fs from "fs";
import * as path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CACHE_DIR = path.join(process.cwd(), "tests", "e2e", ".cache");
const SEED_JSON_PATH = path.join(CACHE_DIR, "seed.json");

export default async function globalSetup() {
  try {
    const eventCount = await prisma.event.count();
    const lotCount = await prisma.ticketLot.count();
    const userCount = await prisma.user.count();

    if (eventCount === 0 || lotCount === 0 || userCount === 0) {
      throw new Error(
        "E2E requires a seeded DB. Run from apps/web: npm run e2e:prep (migrate deploy + db:seed). " +
          `Current: ${eventCount} events, ${lotCount} ticket lots, ${userCount} users.`
      );
    }

    const event = await prisma.event.findUnique({
      where: { slug: "evento-seed-1" },
    });
    if (!event) {
      throw new Error(
        'E2E fixture: event with slug "evento-seed-1" not found. Run npm run e2e:prep to seed DB.'
      );
    }

    const ticket = await prisma.ticket.findFirst({
      where: {
        eventId: event.id,
        qrPayload: { not: "" },
        checkedInAt: null,
      },
    });
    if (!ticket?.qrPayload) {
      throw new Error(
        `E2E fixture: no unused ticket (checkedInAt null) with valid qrPayload for event "evento-seed-1". Run npm run e2e:prep to seed DB.`
      );
    }

    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    fs.writeFileSync(
      SEED_JSON_PATH,
      JSON.stringify(
        {
          eventId: event.id,
          eventSlug: "evento-seed-1",
          validQr: ticket.qrPayload,
        },
        null,
        2
      ),
      "utf-8"
    );
  } catch (e) {
    const err = e as Error;
    if (err.message?.includes("E2E requires") || err.message?.includes("E2E fixture")) {
      throw err;
    }
    throw new Error(
      "E2E globalSetup: could not verify DB. Ensure DATABASE_URL is set and run: npm run e2e:prep. " +
        (err.message ?? String(e))
    );
  } finally {
    await prisma.$disconnect();
  }
}
