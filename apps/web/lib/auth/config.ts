/**
 * NextAuth Configuration
 * Credentials, Google and Apple providers with JWT
 */

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import AppleProvider from 'next-auth/providers/apple';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Normalize email to lowercase and trim
        const normalizedEmail = credentials.email.toLowerCase().trim();
        
        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (!user) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isValid) {
          return null;
        }

        // Check if email is verified
        // In development, allow login even if not verified (for testing)
        if (!user.emailVerified && process.env.NODE_ENV === 'production') {
          throw new Error("Email não verificado. Por favor, verifique o seu email.");
        }
        
        // In development, log warning but allow login
        if (!user.emailVerified && process.env.NODE_ENV === 'development') {
          console.warn(`⚠️  Login allowed for unverified email in development: ${user.email}`);
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    // TODO: Fix AppleProvider clientSecret type
    ...(process.env.APPLE_ID && process.env.APPLE_SECRET && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID
      ? [
          AppleProvider({
            clientId: process.env.APPLE_ID,
            clientSecret: {
              appleId: process.env.APPLE_ID,
              teamId: process.env.APPLE_TEAM_ID,
              keyId: process.env.APPLE_KEY_ID,
              privateKey: process.env.APPLE_SECRET.replace(/\\n/g, '\n'),
            } as any, // Type assertion until NextAuth types are updated
          }),
        ]
      : []),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle OAuth sign in - create or update user
      if (account?.provider === 'google' || account?.provider === 'apple') {
        if (!user.email) {
          return false;
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (existingUser) {
          // Update user info if needed
          if (user.name && user.name !== existingUser.name) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { name: user.name },
            });
          }
          return true;
        }

        // Create new user
        await prisma.user.create({
          data: {
            email: user.email,
            name: user.name || null,
            passwordHash: '', // OAuth users don't have passwords
            role: 'USER',
          },
        });

        return true;
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.email = user.email;
        token.name = user.name;
      }
      
      // For OAuth, fetch user from database
      if (account && (account.provider === 'google' || account.provider === 'apple')) {
        if (user?.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.email = dbUser.email;
            token.name = dbUser.name;
          }
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        session.user.email = token.email as string;
        session.user.name = token.name as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET || 'dev-secret-key-change-in-production-12345678901234567890',
};
