import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { Role } from "@ticketing-platform/shared/src/rbac";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Normalize email to lowercase and trim
          const normalizedEmail = credentials.email.toLowerCase().trim();

          console.log(`[auth] Attempting authentication for: ${normalizedEmail}`);

          // Find user with normalized email
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

          if (!user) {
            console.log(`[auth] User not found: ${normalizedEmail}`);
            return null;
          }

          // Verify password
          const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!isValid) {
            console.log(`[auth] Invalid password for: ${normalizedEmail}`);
            return null;
          }

          // Check if email is verified (only in production)
          if (!user.emailVerified && process.env.NODE_ENV === 'production') {
            console.log(`[auth] Email not verified for: ${normalizedEmail}`);
            throw new Error("Email não verificado. Por favor, verifique o seu email.");
          }

          console.log(`[auth] Login successful for: ${normalizedEmail} (${user.role})`);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error: any) {
          console.error("[auth] Authentication error:", error.message);
          if (error.message.includes("Email não verificado")) {
            throw error;
          }
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
        token.email = user.email;
        token.name = user.name;
      }

      // If session is being updated, refresh user data from database
      if (trigger === "update" && token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, email: true, name: true },
          });
          if (dbUser) {
            token.role = dbUser.role as Role;
            token.email = dbUser.email;
            token.name = dbUser.name;
          }
        } catch (error) {
          console.error("[auth] Error updating JWT from database:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as Role;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || 'dev-secret-key-change-in-production-12345678901234567890',
  debug: process.env.NODE_ENV === "development",
};
