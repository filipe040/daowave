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
    
    // Resolve base URL from environment (server-side)
    const baseUrl =
      process.env.APP_URL ??
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.NEXTAUTH_URL;

    if (!baseUrl) {
      throw new Error("APP_URL is not defined");
    }

    return baseUrl;
  }
  
  // Client-side: use current origin (respects http/https automatically)
  return window.location.origin;
}
