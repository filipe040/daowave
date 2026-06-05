import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Build redirect URL using proxy headers (nginx/Cloudflare), not the internal bind address. */
function redirectUrl(request: NextRequest, pathname: string, params?: Record<string, string>) {
  const url = request.nextUrl.clone();
  const qIndex = pathname.indexOf("?");
  url.pathname = qIndex === -1 ? pathname : pathname.slice(0, qIndex);
  url.search = "";
  if (qIndex !== -1) {
    new URLSearchParams(pathname.slice(qIndex + 1)).forEach((value, key) => {
      url.searchParams.set(key, value);
    });
  }
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ??
    request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto");
  if (host) {
    const [hostname, port] = host.includes(":") ? host.split(":") : [host, ""];
    url.hostname = hostname;
    url.port = port;
  } else {
    url.port = "";
  }
  if (proto) url.protocol = proto.endsWith(":") ? proto : `${proto}:`;
  return url;
}

/**
 * Edge-safe middleware - 100% Edge Runtime Compatible
 *
 * CRITICAL: This middleware uses ONLY Edge-compatible APIs
 * - NO imports from local files (lib/config, lib/env, etc.)
 * - NO Node.js APIs (__dirname, fs, path, process.cwd, etc.)
 * - Uses ONLY process.env.* directly
 * - Uses ONLY Edge-compatible imports (next/server, next-auth/jwt)
 *
 * Authentication:
 * - Uses getToken from next-auth/jwt (Edge-safe)
 * - Wrapped in try/catch to prevent crashes
 * - Falls back gracefully if auth fails
 *
 * Logging: Minimal logging for diagnosis
 * - View logs in Vercel: Dashboard → Project → Runtime Logs → Edge
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Log entry point for diagnosis (minimal, no secrets)
  console.log("[middleware] entry", { path: pathname });

  // Early return for static files and NextAuth routes
  if (
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$/i)
  ) {
    return NextResponse.next();
  }

  // OBJETIVO A: /organizer is legacy alias -> redirect 308 to canonical /promotor
  if (pathname.startsWith("/organizer")) {
    let target: string;
    if (pathname === "/organizer" || pathname === "/organizer/") {
      target = "/promotor";
    } else if (pathname.match(/^\/organizer\/events\/[^/]+\/edit\/?$/)) {
      target = pathname.replace(/^\/organizer\/events\/([^/]+)\/edit\/?$/, "/promotor/events/$1");
    } else if (pathname === "/organizer/events" || pathname === "/organizer/events/") {
      target = "/promotor";
    } else if (pathname.startsWith("/organizer/account")) {
      target = "/account";
    } else {
      target = pathname.replace(/^\/organizer/, "/promotor");
    }
    const url = redirectUrl(request, target);
    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
    return NextResponse.redirect(url, 308);
  }

  try {
    // Create response with security headers
    const response = NextResponse.next();

    // Add security headers (Edge-safe, no external dependencies)
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set(
      "Permissions-Policy",
      "geolocation=(), microphone=(), camera=()"
    );

    // CORS headers (if CORS_ORIGINS is configured)
    // Read directly from process.env (no imports)
    const corsOrigins = process.env.CORS_ORIGINS;
    if (corsOrigins) {
      try {
        const allowedOrigins = corsOrigins.split(",").map((origin) => origin.trim());
        const origin = request.headers.get("origin");
        if (origin && allowedOrigins.includes(origin)) {
          response.headers.set("Access-Control-Allow-Origin", origin);
          response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
          response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        }
      } catch (corsError) {
        // CORS config error - log but don't fail
        console.warn("[middleware] CORS config error", corsError instanceof Error ? corsError.message : "unknown");
      }
    }

    // Check if route needs protection (canonical: /admin, /promotor, /validator)
    const isProtectedRoute =
      pathname.startsWith("/admin") ||
      pathname.startsWith("/promotor") ||
      pathname.startsWith("/validator");

    // If not a protected route, return early with security headers
    if (!isProtectedRoute) {
      return response;
    }

    // Protected routes - use NEXTAUTH_SECRET directly from process.env
    // NO imports from lib/config or lib/env
    const authSecret = process.env.NEXTAUTH_SECRET;

    // If no secret, allow through (degradation - protection handled in route handlers)
    // This prevents middleware from crashing if env var is missing
    if (!authSecret || authSecret.length < 32) {
      console.warn("[middleware] NEXTAUTH_SECRET not configured or too short, skipping route protection");
      return response;
    }

    // Try to get token with comprehensive error handling
    // getToken from next-auth/jwt is Edge-safe, but wrap in try/catch
    // If getToken fails (e.g., due to __dirname issue), we catch and redirect
    let token: any = null;
    try {
      // Dynamic import to isolate potential __dirname issues
      // This ensures that if getToken has issues, we catch them
      const { getToken } = await import("next-auth/jwt");
      token = await getToken({
        req: request as any,
        secret: authSecret
      });
    } catch (authError) {
      // Log auth error without exposing sensitive data
      console.error("[middleware] middleware_auth_error", {
        path: pathname,
        error: authError instanceof Error ? authError.message : "unknown_error",
        // Don't log token or secret
      });

      // On auth error, allow through but log warning
      // This prevents middleware crashes from blocking the entire site
      console.warn("[middleware] Auth check failed, allowing request through");
      return response;
    }

    // If token is null or undefined, user is not authenticated
    if (!token) {
      return NextResponse.redirect(redirectUrl(request, "/auth/signin", { from: pathname }));
    }

    // Determine required role based on path
    const userRole = token.role as string | undefined;

    // OBJETIVO C: Role-based protection
    if (pathname.startsWith("/admin")) {
      if (userRole !== "ADMIN") {
        return NextResponse.redirect(redirectUrl(request, "/auth/signin", { error: "AccessDenied" }));
      }
    }

    if (pathname.startsWith("/promotor")) {
      // Only require authentication here — the requirePromoter() server guard
      // checks OrganizationMember membership and handles role-based redirects.
      // Users may have system role 'USER' while still being org promoters.
      if (!token) {
        return NextResponse.redirect(redirectUrl(request, "/auth/signin", { from: "/promotor" }));
      }
    }

    // Legacy validator route - keep until fully migrated
    if (pathname.startsWith("/validator")) {
      if (userRole !== "VALIDATOR" && userRole !== "ADMIN" && userRole !== "PROMOTER") {
        return NextResponse.redirect(redirectUrl(request, "/auth/signin", { error: "AccessDenied" }));
      }
    }

    return response;
  } catch (error) {
    // Catch-all for any unexpected errors
    // This prevents middleware from crashing the entire application
    console.error("[middleware] middleware_unexpected_error", {
      path: pathname,
      error: error instanceof Error ? error.message : "unknown_error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return response without headers on error (fail open for availability)
    // This ensures the site doesn't go down if middleware has issues
    // Security is handled at route handler level as fallback
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/auth (NextAuth routes)
     * - static assets (images, fonts, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)",
  ],
};
