/**
 * Only allow same-site relative paths (blocks protocol-relative and external URLs).
 * Rejects `//evil.com`, `https://evil.com`, etc.
 */
export function safeRedirectPath(raw: string | null | undefined, fallback = "/"): string {
  if (!raw) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//")) return fallback;
  if (raw.startsWith("/auth")) return fallback;
  return raw;
}
