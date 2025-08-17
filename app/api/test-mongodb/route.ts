import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({ 
        error: "MONGODB_URI not found in environment variables",
        hasUri: false 
      })
    }

    console.log("MongoDB URI exists, attempting connection...")
    
    const client = await clientPromise
    const db = client.db("briefly")
    
    // Test a simple operation
    const collections = await db.listCollections().toArray()
    
    return NextResponse.json({
      success: true,
      message: "MongoDB connection successful",
      collections: collections.map(c => c.name),
      hasUri: true
    })
  } catch (error) {
    console.error("MongoDB connection test failed:", error)
    return NextResponse.json({ 
      error: "MongoDB connection failed", 
      details: error instanceof Error ? error.message : "Unknown error",
      hasUri: !!process.env.MONGODB_URI
    }, { status: 500 })
  }
}
