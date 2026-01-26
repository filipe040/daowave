/**
 * Sentry client-side configuration
 * This file configures Sentry for the browser
 * 
 * CRITICAL: Only initializes if SENTRY_DSN is configured
 * This file is loaded automatically by Next.js Sentry
 * 
 * NOTE: This file will still be bundled by webpack, but Sentry won't initialize
 * if SENTRY_DSN is not set, reducing runtime overhead.
 */

// CRITICAL: Early return if SENTRY_DSN is not configured
// This prevents Sentry from initializing but the file still needs to exist
// for Next.js Sentry to work correctly
if (!process.env.SENTRY_DSN) {
  // Export empty object - Next.js Sentry will handle this gracefully
  module.exports = {};
} else {
  // Only import Sentry if DSN is configured
  const Sentry = require("@sentry/nextjs");
  const { config } = require("./lib/config");

  Sentry.init({
    dsn: config.observability.sentry.enabled ? config.observability.sentry.dsn : undefined,
    environment: config.observability.sentry.environment,
    
    // Performance monitoring
    tracesSampleRate: config.env.isProduction ? 0.1 : 1.0,
    
    // Session replay
    replaysSessionSampleRate: config.env.isStaging || config.env.isProduction ? 0.1 : 0,
    replaysOnErrorSampleRate: config.env.isStaging || config.env.isProduction ? 1.0 : 0,
    
    // Ignore certain errors
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "Non-Error promise rejection captured",
    ],
    
    // Filter out sensitive data
    beforeSend(event: any, hint: any) {
      if (config.env.isDevelopment && !process.env.SENTRY_DEBUG) {
        return null;
      }

      // Sanitize sensitive data
      if (event.request) {
        if (event.request.headers) {
          delete event.request.headers["authorization"];
          delete event.request.headers["cookie"];
        }
      }

      return event;
    },
  });
}

