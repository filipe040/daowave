/**
 * Sentry error tracking configuration
 * Provides error tracking for frontend and backend
 * 
 * CRITICAL: Uses dynamic imports to prevent webpack warnings
 * - Only loads Sentry if SENTRY_DSN is configured
 * - Never imports @sentry/nextjs at top level
 * - Safe to use in server-side code only (not Edge Runtime)
 */

// CRITICAL: NO top-level imports - everything is lazy-loaded
// Dynamic imports to prevent webpack warnings and reduce bundle size

let sentryInitialized = false;

/**
 * Initialize Sentry (dynamic import)
 * Only loads Sentry if SENTRY_DSN is configured
 */
export async function initSentry() {
  // CRITICAL: Check SENTRY_DSN before importing Sentry
  if (!process.env.SENTRY_DSN) {
    return;
  }

  // Skip during build phase
  if (process.env.NEXT_PHASE === "phase-production-build" || 
      process.env.NEXT_PHASE === "phase-development-build" ||
      process.env.NEXT_PHASE === "phase-export") {
    return;
  }

  // Only run in Node.js runtime (not Edge)
  if (process.env.NEXT_RUNTIME === "edge") {
    return;
  }

  if (sentryInitialized) {
    return;
  }

  try {
    // Dynamic import to prevent webpack warnings
    const Sentry = await import("@sentry/nextjs");
    const { config } = await import("./config");

    if (!config.observability.sentry.enabled || !config.observability.sentry.dsn) {
      return;
    }

    Sentry.init({
      dsn: config.observability.sentry.dsn,
      environment: config.observability.sentry.environment,
      
      // Performance monitoring
      tracesSampleRate: config.env.isProduction ? 0.1 : 1.0, // 10% in prod, 100% in dev/staging
      
      // Session replay (only in staging/production)
      replaysSessionSampleRate: config.env.isStaging || config.env.isProduction ? 0.1 : 0,
      replaysOnErrorSampleRate: config.env.isStaging || config.env.isProduction ? 1.0 : 0,
      
      // Ignore certain errors
      ignoreErrors: [
        // Browser extensions
        "top.GLOBALS",
        "originalCreateNotification",
        "canvas.contentDocument",
        "MyApp_RemoveAllHighlights",
        "atomicFindClose",
        "fb_xd_fragment",
        "bmi_SafeAddOnload",
        "EBCallBackMessageReceived",
        "conduitPage",
        // Network errors
        "NetworkError",
        "Failed to fetch",
        "Network request failed",
        // Common non-critical errors
        "ResizeObserver loop limit exceeded",
      ],
      
      // Filter out sensitive data
      beforeSend(event, hint) {
        // Don't send events in development
        if (config.env.isDevelopment && !process.env.SENTRY_DEBUG) {
          return null;
        }

        // Sanitize sensitive data
        if (event.request) {
          // Remove sensitive headers
          if (event.request.headers) {
            delete event.request.headers["authorization"];
            delete event.request.headers["cookie"];
          }
          
          // Sanitize query params
          if (event.request.query_string) {
            const queryString = typeof event.request.query_string === "string" 
              ? event.request.query_string 
              : String(event.request.query_string);
            const sensitiveParams = ["password", "token", "secret", "key"];
            let sanitized = queryString;
            sensitiveParams.forEach((param) => {
              if (sanitized.includes(param)) {
                sanitized = sanitized.replace(
                  new RegExp(`${param}=[^&]*`, "gi"),
                  `${param}=***`
                );
              }
            });
            event.request.query_string = sanitized;
          }
        }

        return event;
      },
    });

    sentryInitialized = true;
  } catch (error) {
    // Log error but don't crash - Sentry initialization should be resilient
    console.warn("⚠️  Sentry initialization failed:", error instanceof Error ? error.message : "unknown");
  }
}

/**
 * Capture exception (dynamic import)
 */
export async function captureException(error: Error, context?: Record<string, any>) {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  try {
    const Sentry = await import("@sentry/nextjs");
    const { config } = await import("./config");
    
    if (!config.observability.sentry.enabled) {
      return;
    }

    Sentry.captureException(error, {
      extra: context,
    });
  } catch (err) {
    // Silently fail if Sentry is not available
  }
}

/**
 * Capture message (dynamic import)
 */
export async function captureMessage(message: string, level: "info" | "warning" | "error" | "fatal" | "debug" = "info", context?: Record<string, any>) {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  try {
    const Sentry = await import("@sentry/nextjs");
    const { config } = await import("./config");
    
    if (!config.observability.sentry.enabled) {
      return;
    }

    Sentry.captureMessage(message, {
      level,
      extra: context,
    });
  } catch (err) {
    // Silently fail if Sentry is not available
  }
}

/**
 * Set user context (dynamic import)
 */
export async function setUser(user: { id: string; email?: string; role?: string }) {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  try {
    const Sentry = await import("@sentry/nextjs");
    const { config } = await import("./config");
    
    if (!config.observability.sentry.enabled) {
      return;
    }

    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.email,
      role: user.role,
    });
  } catch (err) {
    // Silently fail if Sentry is not available
  }
}

/**
 * Clear user context (dynamic import)
 */
export async function clearUser() {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  try {
    const Sentry = await import("@sentry/nextjs");
    const { config } = await import("./config");
    
    if (!config.observability.sentry.enabled) {
      return;
    }

    Sentry.setUser(null);
  } catch (err) {
    // Silently fail if Sentry is not available
  }
}

/**
 * Add breadcrumb (dynamic import)
 */
export async function addBreadcrumb(message: string, category: string, level: "info" | "warning" | "error" | "fatal" | "debug" = "info", data?: Record<string, any>) {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  try {
    const Sentry = await import("@sentry/nextjs");
    const { config } = await import("./config");
    
    if (!config.observability.sentry.enabled) {
      return;
    }

    Sentry.addBreadcrumb({
      message,
      category,
      level,
      data,
    });
  } catch (err) {
    // Silently fail if Sentry is not available
  }
}

