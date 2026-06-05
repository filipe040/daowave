import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { Role } from "@ticketing-platform/shared/src/rbac";
import { createAuditLog } from "./audit";

// ── Helpers ────────────────────────────────────────────────────────────────

/** Detect Apple "Hide My Email" relay addresses */
function isApplePrivateRelay(email: string | null | undefined): boolean {
  return !!email?.endsWith("@privaterelay.appleid.com");
}

/**
 * Upsert a linked OAuth account for an existing user.
 * Creates the Account row if it doesn't exist, updates tokens if it does.
 */
async function linkOAuthAccount(params: {
  userId: string;
  provider: string;
  providerAccountId: string;
  email?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  idToken?: string | null;
  expiresAt?: number | null;
}) {
  await prisma.account.upsert({
    where: {
      provider_providerAccountId: {
        provider: params.provider,
        providerAccountId: params.providerAccountId,
      },
    },
    update: {
      accessToken: params.accessToken,
      refreshToken: params.refreshToken,
      idToken: params.idToken,
      expiresAt: params.expiresAt,
      email: params.email,
    },
    create: {
      userId: params.userId,
      provider: params.provider,
      providerAccountId: params.providerAccountId,
      email: params.email,
      accessToken: params.accessToken,
      refreshToken: params.refreshToken,
      idToken: params.idToken,
      expiresAt: params.expiresAt,
    },
  });
}

// ── AuthOptions ────────────────────────────────────────────────────────────

export const authOptions: NextAuthOptions = {
  providers: [
    // ── Google ──────────────────────────────────────────────────────────
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
        GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          authorization: {
            params: {
              // Request offline access for refresh token
              access_type: "offline",
              prompt: "select_account",
            },
          },
        }),
      ]
      : []),

    // ── Apple ────────────────────────────────────────────────────────────
    ...(process.env.APPLE_CLIENT_ID &&
      process.env.APPLE_TEAM_ID &&
      process.env.APPLE_PRIVATE_KEY &&
      process.env.APPLE_PRIVATE_KEY_ID
      ? [
        AppleProvider({
          clientId: process.env.APPLE_CLIENT_ID,
          clientSecret: {
            appleId: process.env.APPLE_CLIENT_ID,
            teamId: process.env.APPLE_TEAM_ID,
            privateKey: process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
            keyId: process.env.APPLE_PRIVATE_KEY_ID,
          } as any,
        }),
      ]
      : []),

    // ── Email / Password ─────────────────────────────────────────────────
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const normalizedEmail = credentials.email.toLowerCase().trim();
          const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              passwordHash: true,
              emailVerified: true,
            },
          });

          if (!user || !user.passwordHash) {
            // OAuth-only user trying to use password login
            console.log(`[auth] No credentials for: ${normalizedEmail}`);
            return null;
          }

          const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!isValid) {
            console.log(`[auth] Invalid password for: ${normalizedEmail}`);
            await createAuditLog({
              action: "auth.login.failed",
              entityType: "user",
              entityId: user.id,
              details: { provider: "credentials", reason: "invalid_password" },
            });
            return null;
          }

          if (!user.emailVerified && process.env.NODE_ENV === "production") {
            throw new Error("Email não verificado. Por favor, verifique o seu email.");
          }

          await createAuditLog({
            userId: user.id,
            action: "auth.login.success",
            entityType: "user",
            entityId: user.id,
            details: { provider: "credentials" },
          });

          return { id: user.id, email: user.email, name: user.name, role: user.role };
        } catch (error: any) {
          if (error.message?.includes("Email não verificado")) throw error;
          return null;
        }
      },
    }),
  ],

  callbacks: {
    // ── signIn ────────────────────────────────────────────────────────────
    /**
     * Called for OAuth providers after the user authenticates with the provider.
     * We handle account linking here: if a user with that email already exists,
     * we link the OAuth account to them instead of creating a duplicate.
     */
    async signIn({ user, account, profile }) {
      // Credentials: handled in authorize(); just pass through
      if (!account || account.type === "credentials") return true;

      const provider = account.provider; // "google" | "apple"
      const providerAccountId = (account.providerUserId ?? account.providerAccountId ?? (user as any).id) as string;

      // Determine the real email (Apple may hide it)
      const rawEmail =
        (profile as any)?.email ?? user.email ?? null;
      const isHiddenEmail = isApplePrivateRelay(rawEmail);
      const emailForLookup = isHiddenEmail ? null : rawEmail?.toLowerCase().trim() ?? null;

      try {
        // 1. Check if this provider account already exists
        const existingAccount = await prisma.account.findUnique({
          where: {
            provider_providerAccountId: { provider, providerAccountId },
          },
          include: { user: { select: { id: true, email: true, role: true } } },
        });

        if (existingAccount) {
          // Known provider → update tokens, inject user id so jwt callback gets it
          await linkOAuthAccount({
            userId: existingAccount.userId,
            provider,
            providerAccountId,
            email: rawEmail,
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            idToken: account.id_token,
            expiresAt: account.expires_at,
          });
          // Inject id so jwt callback can load the role
          (user as any).id = existingAccount.userId;

          await createAuditLog({
            userId: existingAccount.userId,
            action: "auth.login.success",
            entityType: "user",
            entityId: existingAccount.userId,
            details: { provider, returning: true },
          });
          return true;
        }

        // 2. No existing Account → try linking by email
        let dbUser: { id: string; email: string; role: string } | null = null;

        if (emailForLookup) {
          dbUser = await prisma.user.findUnique({
            where: { email: emailForLookup },
            select: { id: true, email: true, role: true },
          });
        }

        if (dbUser) {
          // Link to existing account
          await linkOAuthAccount({
            userId: dbUser.id,
            provider,
            providerAccountId,
            email: rawEmail,
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            idToken: account.id_token,
            expiresAt: account.expires_at,
          });
          (user as any).id = dbUser.id;

          await createAuditLog({
            userId: dbUser.id,
            action: "auth.account.linked",
            entityType: "user",
            entityId: dbUser.id,
            details: { provider, email: rawEmail },
          });
        } else {
          // 3. Create new user
          const name =
            (profile as any)?.name ??
            (profile as any)?.given_name ??
            user.name ??
            "Utilizador";

          const newUser = await prisma.user.create({
            data: {
              email: emailForLookup ?? `${providerAccountId}@${provider}.oauth`,
              name,
              emailVerified: !isHiddenEmail, // Google emails are pre-verified
              role: "USER",
              passwordHash: null as any, // Explicitly null for OAuth-only users
            },
          });

          await linkOAuthAccount({
            userId: newUser.id,
            provider,
            providerAccountId,
            email: rawEmail,
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            idToken: account.id_token,
            expiresAt: account.expires_at,
          });

          (user as any).id = newUser.id;
          (user as any).requiresEmailUpdate = isHiddenEmail;

          await createAuditLog({
            userId: newUser.id,
            action: "auth.register.oauth",
            entityType: "user",
            entityId: newUser.id,
            details: { provider, hiddenEmail: isHiddenEmail },
          });
        }

        return true;
      } catch (err) {
        console.error("[auth] signIn OAuth error:", err);
        await createAuditLog({
          action: "auth.login.failed",
          entityType: "auth",
          details: { provider, error: String(err) },
        });
        return "/auth/signin?error=OAuthError";
      }
    },

    // ── JWT ───────────────────────────────────────────────────────────────
    async jwt({ token, user, account, trigger }) {
      // First sign-in: user object is present
      if (user) {
        token.id = (user as any).id;
        token.email = user.email;
        token.name = user.name;
        token.provider = account?.provider ?? "credentials";
        token.requiresEmailUpdate = (user as any).requiresEmailUpdate ?? false;
      }

      // For OAuth logins, role isn't in the provider profile → load from DB
      if (user?.id || (trigger === "update" && token.id)) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: (user?.id ?? token.id) as string },
            select: { role: true, email: true, name: true },
          });
          if (dbUser) {
            token.role = dbUser.role as Role;
            token.email = dbUser.email;
            token.name = dbUser.name;
          }
        } catch (err) {
          console.error("[auth] JWT DB fetch error:", err);
        }
      }

      return token;
    },

    // ── Session ───────────────────────────────────────────────────────────
    async session({ session, token }) {
      if (session.user && token) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as Role;
        (session.user as any).provider = token.provider as string;
        (session.user as any).requiresEmailUpdate = token.requiresEmailUpdate as boolean;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },

    // ── Redirect (role-based) ─────────────────────────────────────────────
    async redirect({ url, baseUrl }) {
      // Allow relative URLs and same-origin; block localhost / external redirects
      if (url.startsWith("/") && !url.startsWith("//")) return url;
      if (url.startsWith(baseUrl)) return url;
      try {
        const target = new URL(url);
        const base = new URL(baseUrl);
        if (target.origin === base.origin) return url;
      } catch {
        /* ignore malformed URLs */
      }
      return baseUrl;
    },
  },

  events: {
    async signIn({ user }) {
      try {
        if (!user?.email) return;

        // -- Capture headers (server context) --
        let ip = "Desconhecido";
        let userAgent = "Desconhecido";
        try {
          const { headers } = await import("next/headers");
          const hdrs = await headers();
          ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim()
            || hdrs.get("x-real-ip")
            || "Desconhecido";
          userAgent = hdrs.get("user-agent") || "Desconhecido";
        } catch { /* headers() unavailable in some contexts */ }

        // -- Parse device from user-agent --
        function parseDevice(ua: string): string {
          if (/iPhone/i.test(ua)) return "iPhone";
          if (/iPad/i.test(ua)) return "iPad";
          if (/Android/i.test(ua) && /Mobile/i.test(ua)) return "Android (Telemóvel)";
          if (/Android/i.test(ua)) return "Android (Tablet)";
          if (/Windows/i.test(ua)) return "Windows (PC)";
          if (/Macintosh/i.test(ua)) return "Mac (PC)";
          if (/Linux/i.test(ua)) return "Linux (PC)";
          return "Dispositivo desconhecido";
        }
        const device = parseDevice(userAgent);

        // -- Geo-lookup --
        let location = "Localização desconhecida";
        try {
          if (ip && ip !== "Desconhecido" && !ip.startsWith("127.") && !ip.startsWith("::")) {
            const geo = await fetch(`http://ip-api.com/json/${ip}?fields=city,country,status`, {
              signal: AbortSignal.timeout(2000),
            }).then(r => r.json());
            if (geo?.status === "success") {
              location = [geo.city, geo.country].filter(Boolean).join(", ");
            }
          }
        } catch { /* geo lookup failed, continue */ }

        // -- Build forgot-password link (pre-filled email) --
        const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://tickets.daowave.pt";
        const resetUrl = `${appUrl}/auth/forgot-password?email=${encodeURIComponent(user.email)}`;
        const timestamp = new Date().toLocaleString("pt-PT", { timeZone: "Europe/Lisbon" });

        const { sendLoginNotificationEmail } = await import("./email-service");
        await sendLoginNotificationEmail(
          user.email,
          user.name || "Utilizador",
          { ip, userAgent, timestamp: new Date() },
          { device, location, timestamp, resetUrl }
        );
      } catch (err) {
        console.error("[auth] Login notification email error:", err);
      }
    },
  },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin", // OAuth errors land on signin with ?error=
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || "dev-secret-key-change-in-production-12345678901234567890",
  debug: process.env.NODE_ENV === "development",
};
