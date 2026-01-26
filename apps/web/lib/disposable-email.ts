/**
 * Disposable Email Detection
 * Blocks common disposable email providers
 */

const DISPOSABLE_EMAIL_DOMAINS = [
  // Common disposable email services
  "10minutemail.com",
  "guerrillamail.com",
  "mailinator.com",
  "tempmail.com",
  "throwaway.email",
  "yopmail.com",
  "getnada.com",
  "mohmal.com",
  "temp-mail.org",
  "maildrop.cc",
  "sharklasers.com",
  "grr.la",
  "guerrillamailblock.com",
  "pokemail.net",
  "spam4.me",
  "bccto.me",
  "chammy.info",
  "dispostable.com",
  "emailondeck.com",
  "fakeinbox.com",
  "fakemailgenerator.com",
  "getairmail.com",
  "inboxkitten.com",
  "mintemail.com",
  "mohmal.com",
  "mytrashmail.com",
  "nada.email",
  "putthisin.com",
  "sharklasers.com",
  "spamgourmet.com",
  "tempail.com",
  "tempmailo.com",
  "trashmail.com",
  "trashmailer.com",
  "trashymail.com",
  "yopmail.com",
];

const DISPOSABLE_EMAIL_PATTERNS = [
  /^temp/i,
  /^test/i,
  /^fake/i,
  /^spam/i,
  /^trash/i,
  /^throwaway/i,
  /^disposable/i,
  /^noreply/i,
  /^no-reply/i,
];

/**
 * Check if email is from disposable provider
 */
export function isDisposableEmail(email: string): boolean {
  const normalizedEmail = email.toLowerCase().trim();
  const [, domain] = normalizedEmail.split("@");
  
  if (!domain) {
    return false;
  }

  // Check against known disposable domains
  if (DISPOSABLE_EMAIL_DOMAINS.includes(domain)) {
    return true;
  }

  // Check against patterns
  for (const pattern of DISPOSABLE_EMAIL_PATTERNS) {
    if (pattern.test(domain)) {
      return true;
    }
  }

  return false;
}
