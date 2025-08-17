import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const { transcript, summary, customPrompt, emailRecipients } = await request.json()

    if (!summary || !transcript) {
      return NextResponse.json({ error: "Summary and transcript are required" }, { status: 400 })
    }

    if (!process.env.MONGODB_URI) {
      console.log("MongoDB not configured, skipping database save")
      return NextResponse.json({
        success: true,
        message: "Summary processed (database not configured)",
      })
    }

    // For testing without MongoDB, uncomment this block:
    /*
    console.log("Skipping MongoDB save for testing")
    return NextResponse.json({
      success: true,
      id: "test-id-" + Date.now(),
      message: "Summary saved successfully (test mode)",
    })
    */

    const client = await clientPromise
    
    // Check if client is null (MongoDB not configured)
    if (!client) {
      console.log("MongoDB not configured, skipping database save")
      return NextResponse.json({
        success: true,
        id: "no-db-" + Date.now(),
        message: "Summary processed (database not configured)",
      })
    }
    
    const db = client.db("briefly")
    const collection = db.collection("summaries")

    const summaryDoc = {
      transcript,
      summary,
      customPrompt: customPrompt || "",
      emailRecipients: emailRecipients || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await collection.insertOne(summaryDoc)

    return NextResponse.json({
      success: true,
      id: result.insertedId,
      message: "Summary saved successfully",
    })
  } catch (error) {
    console.error("Error saving summary:", error)
    return NextResponse.json({ error: "Failed to save summary" }, { status: 500 })
  }
}
