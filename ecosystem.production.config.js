module.exports = {
  apps: [{
    name: 'daowave',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/daowave/daowave/apps/web',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/home/sant0s/.pm2/logs/daowave-error.log',
    out_file: '/home/sant0s/.pm2/logs/daowave-out.log',
    log_file: '/home/sant0s/.pm2/logs/daowave-combined.log',
    time: true,
    // Additional stability options for Next.js 15
    node_args: '--max-old-space-size=2048',
    // Kill timeout for graceful shutdown
    kill_timeout: 5000,
    // Wait time before restart
    restart_delay: 2000,
    // Better error handling
    max_restarts: 10,
    min_uptime: '10s',
    // Environment specific
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    // Next.js specific optimizations
    exec_mode: 'fork',
    // Graceful reload
    listen_timeout: 8000,
    // Additional environment variables for Next.js stability
    env_production: {
      NODE_ENV: 'production',
      NEXT_TELEMETRY_DISABLED: '1',
      // Disable Next.js telemetry to reduce memory usage
      DISABLE_OPENCOLLECTIVE: 'true',
      // Force production optimizations
      __NEXT_OPTIMIZE_FONTS: 'true',
      __NEXT_OPTIMIZE_IMAGES: 'true'
    }
  }]
};
