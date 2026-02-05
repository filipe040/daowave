/**
 * Admin route to manually verify a user's email
 * For development/testing purposes
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { safeLog } from "@/lib/security";

export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Allow if admin or in development
    const isAdmin = session?.user?.role === 'ADMIN';
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (!isAdmin && !isDevelopment) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { userId } = await params;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { message: "User already verified", user },
        { status: 200 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpiresAt: null,
      },
    });

    safeLog.info("User manually verified", {
      userId: user.id,
      email: user.email,
      verifiedBy: session?.user?.id || 'development',
    });

    return NextResponse.json(
      { message: "User verified successfully", user: { ...user, emailVerified: true } },
      { status: 200 }
    );
  } catch (error: any) {
    safeLog.error("Error verifying user", { error: error.message });
    return NextResponse.json(
      { error: error.message || "Error verifying user" },
      { status: 500 }
    );
  }
}
