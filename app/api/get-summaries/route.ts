import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({
        success: true,
        summaries: [],
        message: "Database not configured",
      })
    }

    const client = await clientPromise
    const db = client.db("briefly")
    const collection = db.collection("summaries")

    const summaries = await collection.find({}).sort({ createdAt: -1 }).limit(20).toArray()

    return NextResponse.json({
      success: true,
      summaries: summaries.map((summary) => ({
        id: summary._id,
        transcript: summary.transcript.substring(0, 100) + "...",
        summary: summary.summary,
        customPrompt: summary.customPrompt,
        emailRecipients: summary.emailRecipients,
        createdAt: summary.createdAt,
      })),
    })
  } catch (error) {
    console.error("Error fetching summaries:", error)
    return NextResponse.json({ error: "Failed to fetch summaries" }, { status: 500 })
  }
}
