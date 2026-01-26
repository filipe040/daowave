import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { collectLoginInfo } from "@/lib/security";
import { sendLoginNotificationEmail } from "@/lib/email-service";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Collect login information
    const loginInfo = await collectLoginInfo(req);

    // Get user details
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { name: true, email: true },
    });

    if (user) {
      // Send login notification email (async, don't block response)
      sendLoginNotificationEmail(user.email, user.name || "Utilizador", loginInfo).catch((error) => {
        console.error("Error sending login notification email:", error);
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in login notification:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

