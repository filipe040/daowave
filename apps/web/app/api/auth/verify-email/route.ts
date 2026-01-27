import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safeLog } from "@/lib/security";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const baseUrl =
    process.env.APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXTAUTH_URL;

  if (!baseUrl) {
    throw new Error("APP_URL is not defined");
  }
  
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    safeLog.info("Email verification attempt", { 
      token: token ? `${token.substring(0, 10)}...` : 'missing',
      url: req.url 
    });

    if (!token) {
      safeLog.warn("Email verification failed: no token provided");
      return NextResponse.redirect(`${baseUrl}/auth/verify-email?error=invalid_token`);
    }

    // Find user by token
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { emailVerificationToken: token },
      });
    } catch (dbError: any) {
      safeLog.error("Database error finding user by token", { 
        error: dbError.message,
        errorCode: dbError.code 
      });
      return NextResponse.redirect(`${baseUrl}/auth/verify-email?error=verification_failed`);
    }

    if (!user) {
      safeLog.warn("Email verification failed: user not found", { 
        token: `${token.substring(0, 10)}...` 
      });
      return NextResponse.redirect(`${baseUrl}/auth/verify-email?error=invalid_token`);
    }

    safeLog.info("User found for verification", { 
      userId: user.id,
      email: user.email,
      alreadyVerified: user.emailVerified 
    });

    // Check if already verified
    if (user.emailVerified) {
      safeLog.info("Email already verified", { userId: user.id });
      return NextResponse.redirect(`${baseUrl}/auth/signin?verified=true`);
    }

    // Check expiration
    if (!user.emailVerificationTokenExpiresAt) {
      safeLog.warn("Email verification failed: no expiration date", { userId: user.id });
      return NextResponse.redirect(`${baseUrl}/auth/verify-email?error=expired_token`);
    }

    if (user.emailVerificationTokenExpiresAt < new Date()) {
      safeLog.warn("Email verification failed: token expired", { 
        userId: user.id,
        expiresAt: user.emailVerificationTokenExpiresAt 
      });
      return NextResponse.redirect(`${baseUrl}/auth/verify-email?error=expired_token`);
    }

    // Activate account
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          emailVerificationToken: null,
          emailVerificationTokenExpiresAt: null,
        },
      });

      safeLog.info("Email verified successfully", { userId: user.id, email: user.email });
    } catch (updateError: any) {
      safeLog.error("Database error updating user", { 
        error: updateError.message,
        errorCode: updateError.code,
        userId: user.id 
      });
      return NextResponse.redirect(`${baseUrl}/auth/verify-email?error=verification_failed`);
    }

    return NextResponse.redirect(`${baseUrl}/auth/signin?verified=true`);
  } catch (error: any) {
    safeLog.error("Unexpected error verifying email", { 
      error: error.message,
      stack: error.stack 
    });
    return NextResponse.redirect(`${baseUrl}/auth/verify-email?error=verification_failed`);
  }
}
