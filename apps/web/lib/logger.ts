/**
 * Structured logging utility
 * Provides consistent log format for API and application logs
 */

export interface LogContext {
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  requestId?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
}

/**
 * Structured logger
 */
class Logger {
  private formatLog(level: LogEntry["level"], message: string, context?: LogContext, error?: Error): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    if (context) {
      entry.context = context;
    }

    if (error) {
      entry.error = {
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      };
    }

    return entry;
  }

  info(message: string, context?: LogContext) {
    const entry = this.formatLog("info", message, context);
    console.log(JSON.stringify(entry));
  }

  warn(message: string, context?: LogContext) {
    const entry = this.formatLog("warn", message, context);
    console.warn(JSON.stringify(entry));
  }

  error(message: string, error?: Error, context?: LogContext) {
    const entry = this.formatLog("error", message, context, error);
    console.error(JSON.stringify(entry));
  }

  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === "development") {
      const entry = this.formatLog("debug", message, context);
      console.debug(JSON.stringify(entry));
    }
  }

  /**
   * Log API request
   */
  request(req: {
    method: string;
    url: string;
    ip?: string;
    userAgent?: string;
    userId?: string;
  }) {
    this.info("API request", {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.userAgent,
      userId: req.userId,
    });
  }

  /**
   * Log API response
   */
  response(req: {
    method: string;
    url: string;
    statusCode: number;
    duration: number;
    userId?: string;
  }) {
    const level = req.statusCode >= 500 ? "error" : req.statusCode >= 400 ? "warn" : "info";
    const context = {
      method: req.method,
      url: req.url,
      statusCode: req.statusCode,
      duration: req.duration,
      userId: req.userId,
    };
    if (level === "error") {
      this.error(`API response ${req.statusCode}`, undefined, context);
    } else if (level === "warn") {
      this.warn(`API response ${req.statusCode}`, context);
    } else {
      this.info(`API response ${req.statusCode}`, context);
    }
  }
}

export const logger = new Logger();

