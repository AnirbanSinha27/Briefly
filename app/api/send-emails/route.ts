import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { summary, recipients } = await request.json()

    if (!summary || !recipients || recipients.length === 0) {
      return NextResponse.json({ error: "Summary and recipients are required" }, { status: 400 })
    }

    // EmailJS will be handled client-side, so we just validate and return success
    return NextResponse.json({
      success: true,
      message: `Ready to send email to ${recipients.length} recipient(s)`,
      summary,
      recipients,
    })
  } catch (error) {
    console.error("Error processing email request:", error)
    return NextResponse.json({ error: "Failed to process email request" }, { status: 500 })
  }
}
