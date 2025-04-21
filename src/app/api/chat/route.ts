import { type NextRequest, NextResponse } from "next/server"
import { createAIProvider, type AIModelKey, type ChatMessage } from "@/lib/ai-provider"

export async function POST(req: NextRequest) {
  try {
    const { messages, modelKey } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid request: messages must be an array" }, { status: 400 })
    }

    if (!modelKey) {
      return NextResponse.json({ error: "Invalid request: modelKey is required" }, { status: 400 })
    }

    const aiProvider = createAIProvider(modelKey as AIModelKey)
    const { response, thinking } = await aiProvider.getCompletion(messages as ChatMessage[])

    return NextResponse.json({ response, thinking })
  } catch (error) {
    console.error("Error in chat API:", error)
    return NextResponse.json({ error: (error as Error).message || "An error occurred" }, { status: 500 })
  }
}
