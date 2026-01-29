#!/usr/bin/env node
/**
 * Ensure DB schema compatible with application expectations.
 * - Adds missing columns if they don't exist.
 * - Runs safe ALTER statements via Prisma $executeRawUnsafe.
 *
 * Run before prisma migrate deploy to avoid P2022 runtime errors.
 */
const { PrismaClient } = require("@prisma/client");

async function ensure() {
  const prisma = new PrismaClient();
  try {
    console.log("[ensure-schema] checking schema...");

    // Helper to check column existence
    async function hasColumn(table, column) {
      const res = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='${table}' AND COLUMN_NAME='${column}'`
      );
      const cnt = res && res[0] && (res[0].cnt || res[0].CNT || res[0]["COUNT(*)"]);
      return Number(cnt) > 0;
    }

    // Ensure User.avatarUrl
    if (!(await hasColumn("User", "avatarUrl"))) {
      console.log("Adding User.avatarUrl...");
      await prisma.$executeRawUnsafe(`ALTER TABLE \`User\` ADD COLUMN \`avatarUrl\` VARCHAR(2048) NULL`);
    } else {
      console.log("User.avatarUrl exists.");
    }

    // Ensure Event archived/checkin fields
    const eventCols = [
      ["Event", "archivedAt", "DATETIME NULL"],
      ["Event", "checkinMode", "VARCHAR(191) NULL DEFAULT 'SINGLE'"],
      ["Event", "checkinStartAt", "DATETIME NULL"],
      ["Event", "checkinEndAt", "DATETIME NULL"],
      ["Event", "maxEntries", "INT NULL"],
    ];
    for (const [table, col, type] of eventCols) {
      if (!(await hasColumn(table, col))) {
        console.log(`Adding ${table}.${col}...`);
        await prisma.$executeRawUnsafe(`ALTER TABLE \`${table}\` ADD COLUMN \`${col}\` ${type}`);
      } else {
        console.log(`${table}.${col} exists.`);
      }
    }

    // Ensure Event.badgeTemplateImageUrl is TEXT if exists but shorter type
    if (await hasColumn("Event", "badgeTemplateImageUrl")) {
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE \`Event\` MODIFY COLUMN \`badgeTemplateImageUrl\` TEXT NULL`);
        console.log("Modified Event.badgeTemplateImageUrl to TEXT.");
      } catch (e) {
        console.warn("Could not modify badgeTemplateImageUrl:", e.message || e);
      }
    }

    // Ensure EventAsset table exists
    const res = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='EventAsset'`
    );
    const tableCnt = res && res[0] && (res[0].cnt || res[0].CNT || res[0]["COUNT(*)"]);
    if (Number(tableCnt) === 0) {
      console.log("Creating EventAsset table...");
      await prisma.$executeRawUnsafe(
        `CREATE TABLE EventAsset (
          id VARCHAR(191) NOT NULL PRIMARY KEY,
          eventId VARCHAR(191) NOT NULL,
          filename VARCHAR(1024) NOT NULL,
          url VARCHAR(2048) NOT NULL,
          mimeType VARCHAR(191) NOT NULL,
          size INT NOT NULL,
          createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ) DEFAULT CHARSET=utf8mb4`
      );
      console.log("EventAsset created.");
    } else {
      console.log("EventAsset table exists.");
    }

    // Ensure EventAsset.name column exists for compatibility with older DBs
    async function hasCol(table, column) {
      const r = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='${table}' AND COLUMN_NAME='${column}'`
      );
      const cnt = r && r[0] && (r[0].cnt || r[0].CNT || r[0]["COUNT(*)"]);
      return Number(cnt) > 0;
    }

    if (await hasCol("EventAsset", "id")) {
      if (!(await hasCol("EventAsset", "name"))) {
        console.log("Adding EventAsset.name...");
        try {
          await prisma.$executeRawUnsafe(`ALTER TABLE \`EventAsset\` ADD COLUMN \`name\` VARCHAR(1024) NULL`);
        } catch (e) {
          console.warn("Could not add EventAsset.name:", e.message || e);
        }
      } else {
        console.log("EventAsset.name exists.");
      }
    }

    console.log("[ensure-schema] done.");
  } catch (err) {
    console.error("[ensure-schema] error:", err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

ensure();

