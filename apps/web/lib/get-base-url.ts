// Get base URL that respects the current protocol (HTTP/HTTPS)
export function getBaseUrl(request?: Request) {
  // Server-side: try to detect protocol from headers
  if (typeof window === 'undefined') {
    // If we have access to the request headers, use them
    if (request) {
      const protocol = request.headers.get('x-forwarded-proto') || 
                      (request.url?.startsWith('https') ? 'https' : 'http');
      const host = request.headers.get('host') || 'localhost:3000';
      return `${protocol}://${host}`;
    }
    
    // Try to use NEXTAUTH_URL if set (supports both http and https)
    if (process.env.NEXTAUTH_URL) {
      return process.env.NEXTAUTH_URL;
    }
    
    // Default - will use relative URLs which work with both http and https
    // But for fetch we need absolute URL, so try to detect from env
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    
    // Use APP_URL if set (for production)
    if (process.env.APP_URL) {
      return process.env.APP_URL;
    }
    
    // For local development, default to http
    // In production, this should never be reached if NEXTAUTH_URL or APP_URL are set
    // VERCEL_URL is automatically set by Vercel, so this is a last resort fallback
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    // Only use localhost in development
    if (process.env.NODE_ENV === 'development') {
      return process.env.NEXTAUTH_URL || 'http://localhost:3000';
    }
    // In production, use Vercel URL as fallback if available
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    // Last resort fallback (should not happen in production)
    console.warn("⚠️  APP_URL or NEXTAUTH_URL not set - using fallback");
    return process.env.NEXTAUTH_URL || 'https://daowave-beta.vercel.app';
  }
  
  // Client-side: use current origin (respects http/https automatically)
  return window.location.origin;
}
