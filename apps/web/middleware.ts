import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

    // Check if route needs protection
    const isProtectedRoute = 
      pathname.startsWith("/admin") ||
      pathname.startsWith("/organizer") ||
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
      
      // On auth error, redirect to signin (fail closed for security)
      // This ensures unauthorized users can't access protected routes
      const signInUrl = new URL("/auth/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

    // If token is null or undefined, user is not authenticated
    if (!token) {
      const signInUrl = new URL("/auth/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Determine required role based on path
    const userRole = token.role as string | undefined;

    if (pathname.startsWith("/admin")) {
      if (userRole !== "ADMIN") {
        const signInUrl = new URL("/auth/signin", request.url);
        signInUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(signInUrl);
      }
    } else if (pathname.startsWith("/organizer")) {
      // ORGANIZER or ADMIN allowed
      if (userRole !== "ORGANIZER" && userRole !== "ADMIN") {
        const signInUrl = new URL("/auth/signin", request.url);
        signInUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(signInUrl);
      }
    } else if (pathname.startsWith("/validator")) {
      // VALIDATOR or ADMIN allowed
      if (userRole !== "VALIDATOR" && userRole !== "ADMIN") {
        const signInUrl = new URL("/auth/signin", request.url);
        signInUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(signInUrl);
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
