// Simple in-memory store for reset tokens (in production, use Redis or database)
const resetTokens = new Map<string, { email: string; expiresAt: Date }>();

export function generateResetToken(email: string): string {
  const crypto = require("crypto");
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

  resetTokens.set(token, { email, expiresAt });
  return token;
}

export function verifyResetToken(token: string): { email: string } | null {
  const tokenData = resetTokens.get(token);
  
  if (!tokenData) {
    return null;
  }

  if (new Date() > tokenData.expiresAt) {
    resetTokens.delete(token);
    return null;
  }

  return { email: tokenData.email };
}

export function deleteResetToken(token: string) {
  resetTokens.delete(token);
}

