/**
 * PM2 ecosystem — use this when deploying WITHOUT Docker on a bare VPS.
 * Start:   pm2 start ecosystem.config.js --env production
 * Monitor: pm2 monit
 * Logs:    pm2 logs
 */
module.exports = {
  apps: [
    // ── NestJS API ──────────────────────────────────────────────────────────
    {
      name: 'luxemode-api',
      script: 'dist/main.js',
      cwd: './apps/api',
      instances: 'max',
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '500M',
      env_production: {
        NODE_ENV: 'production',
        APP_PORT: 4000,
      },
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },

    // ── Next.js Web ─────────────────────────────────────────────────────────
    {
      name: 'luxemode-web',
      script: 'node_modules/.bin/next',
      args: 'start --port 3000',
      cwd: './apps/web',
      instances: 2,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '400M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/web-error.log',
      out_file: './logs/web-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
