import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcrypt";
import { Role } from "@ticketing-platform/shared";
import { config } from "./config";
import { safeLog, getRequestMetadata } from "./security";
import { createAuditLog } from "./audit";
import { applyRateLimit, RATE_LIMITS } from "./security";

// Role is now USER instead of CUSTOMER

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        // Rate limiting (if req is available)
        if (req) {
          try {
            const rateLimitResponse = await applyRateLimit(req as any, RATE_LIMITS.auth);
            if (rateLimitResponse) {
              safeLog.warn("Rate limit exceeded for auth", { email: credentials?.email });
              return null;
            }
          } catch (error) {
            // Rate limit check failed, continue anyway
            safeLog.warn("Rate limit check failed", error);
          }
        }

        if (!credentials?.email || !credentials?.password) {
          safeLog.warn("Incomplete credentials", { email: credentials?.email });
          return null;
        }

        try {
          // Normalize email to lowercase and trim
          const normalizedEmail = credentials.email.toLowerCase().trim();
          
          safeLog.debug(`Attempting authentication`, { email: normalizedEmail });
          
          // Ensure Prisma connection
          await prisma.$connect();
          
          // Try to find user with normalized email
          const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
          });

          if (!user) {
            safeLog.warn(`User not found`, { email: normalizedEmail });
            return null;
          }

          const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!isValid) {
            safeLog.warn(`Invalid password`, { email: normalizedEmail });
            return null;
          }

          safeLog.info(`Login successful`, { userId: user.id, email: user.email, role: user.role });

          // Audit log for successful login
          if (req) {
            try {
              const metadata = getRequestMetadata(req as any);
              await createAuditLog({
                userId: user.id,
                action: "USER_LOGIN",
                resourceType: "user",
                resourceId: user.id,
                details: {
                  email: user.email,
                  role: user.role,
                },
                ...metadata,
              });
            } catch (error) {
              // Don't fail login if audit log fails
              safeLog.error("Failed to create login audit log", error);
            }
          }

          // Return user role as-is from database
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role as Role,
          };
        } catch (error: any) {
          safeLog.error("Authentication error", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role as Role;
      }
      
      // If session is being updated, refresh user data from database
      if (trigger === "update" && token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true },
          });
          if (dbUser) {
            token.role = dbUser.role as Role;
          }
        } catch (error) {
          safeLog.error("Error updating JWT from database", error);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
  secret: config.auth.secret,
  debug: config.env.isDevelopment,
};
