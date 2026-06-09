/**
 * PM2 — produção LivePass
 *
 * Escala horizontal: duplicar bloco app com PORT diferente (3000, 3001…)
 * e usar nginx upstream (infra/nginx/livepass.conf.example).
 *
 * Com múltiplas instâncias, REDIS_URL é obrigatório para rate limit coerente.
 */

const instances = Number(process.env.PM2_INSTANCES || 1);

module.exports = {
  apps: [
    {
      name: "livepass",
      script: "npm",
      args: "start",
      cwd: process.env.LIVEPASS_APP_DIR || "/var/www/daowave/daowave/apps/web",
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
  ],
};
