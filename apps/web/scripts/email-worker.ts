#!/usr/bin/env tsx
/**
 * BullMQ email worker — run as separate PM2 process:
 *   pm2 start ecosystem.production.config.js --only livepass-email-worker
 */
import { initEmailWorker } from "../lib/queue/email.queue";

console.log("[email-worker] Starting BullMQ email worker...");
initEmailWorker();
console.log("[email-worker] Worker running. Waiting for jobs...");

process.on("SIGTERM", () => {
  console.log("[email-worker] SIGTERM received, shutting down...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("[email-worker] SIGINT received, shutting down...");
  process.exit(0);
});
