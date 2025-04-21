import type { NextRequest } from "next/server"
import { createAIProvider, type AIModelKey, type ChatMessage } from "@/lib/ai-provider"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const { messages, modelKey } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Invalid request: messages must be an array" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    if (!modelKey) {
      return new Response(JSON.stringify({ error: "Invalid request: modelKey is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Create a TransformStream to handle the streaming response
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()

    // Create AI provider with the specified model
    const aiProvider = createAIProvider(modelKey as AIModelKey)

      // Start streaming in the background
      ; (async () => {
        try {
          let fullContent = ""
          let thinking = ""

          await aiProvider.streamCompletion(messages as ChatMessage[], undefined, {
            onToken: (token) => {
              fullContent += token
              writer.write(encoder.encode(`data: ${JSON.stringify({ type: "token", content: token })}\n\n`))
            },
            onThinking: (thinkingText) => {
              thinking = thinkingText
              writer.write(encoder.encode(`data: ${JSON.stringify({ type: "thinking", content: thinkingText })}\n\n`))
            },
            onComplete: () => {
              writer.write(encoder.encode(`data: ${JSON.stringify({ type: "complete", content: fullContent })}\n\n`))
              writer.write(encoder.encode("data: [DONE]\n\n"))
              writer.close()
            },
            onError: (error) => {
              writer.write(encoder.encode(`data: ${JSON.stringify({ type: "error", error: error.message })}\n\n`))
              writer.close()
            },
          })
        } catch (error) {
          writer.write(encoder.encode(`data: ${JSON.stringify({ type: "error", error: (error as Error).message })}\n\n`))
          writer.close()
        }
      })()

    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message || "An error occurred" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
