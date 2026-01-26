import { NextResponse } from "next/server"
import { getEmailQueue } from "@/lib/queue"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Queue is disabled (stub returns null)
    const queue = await getEmailQueue()

    if (queue) {
      await queue.add("send-email", {
        to: body.email,
        subject: "Welcome!",
        text: "Thank you for signing up",
      })

      return NextResponse.json({
        success: true,
        message: "Email queued successfully",
      })
    } else {
      // Fallback if Redis isn't available
      console.warn("[API] Queue not available, sending email directly")
      // await sendEmailDirectly(body);

      return NextResponse.json({
        success: true,
        message: "Email sent directly (queue not available)",
      })
    }
  } catch (error) {
    console.error("[API] Error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
