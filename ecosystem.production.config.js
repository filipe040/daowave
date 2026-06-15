/**
 * PM2 — produção LivePass
 *
 * Escala horizontal: duplicar bloco app com PORT diferente (3000, 3001…)
 * e usar nginx upstream (infra/nginx/livepass.conf.example).
 *
 * Com múltiplas instâncias, REDIS_URL é obrigatório para rate limit coerente.
 *
 * Arranque:
 *   pm2 start ecosystem.production.config.js
 */

const instances = Number(process.env.PM2_INSTANCES || 1);
const appDir = process.env.LIVEPASS_APP_DIR || "/var/www/daowave/daowave/apps/web";

module.exports = {
  apps: [
    {
      name: "livepass",
      script: "npm",
      args: "start",
      cwd: appDir,
      instances,
      exec_mode: instances > 1 ? "cluster" : "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1536M",
      env: {
        NODE_ENV: "production",
        PORT: process.env.PORT || 3000,
        NEXT_TELEMETRY_DISABLED: "1",
      },
      node_args: "--max-old-space-size=2048",
      kill_timeout: 8000,
      restart_delay: 2000,
      max_restarts: 15,
      min_uptime: "10s",
      merge_logs: true,
      time: true,
    },
    {
      name: "livepass-email-worker",
      script: "npx",
      args: "tsx scripts/email-worker.ts",
      cwd: appDir,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        NEXT_TELEMETRY_DISABLED: "1",
      },
      merge_logs: true,
      time: true,
    },
  ],
};
