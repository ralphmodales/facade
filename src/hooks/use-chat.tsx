"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import { type AIModelKey, type ChatMessage, createAIProvider } from "@/lib/ai-provider"

interface UseChatOptions {
  modelKey: AIModelKey
  initialMessages?: ChatMessage[]
  onThinking?: (thinking: string) => void
  onComplete?: () => void
}

export function useChat({ modelKey, initialMessages = [], onThinking, onComplete }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [aiProvider, setAiProvider] = useState(() => createAIProvider(modelKey))

  // Update AI provider when model changes
  useEffect(() => {
    const provider = createAIProvider(modelKey)
    setAiProvider(provider)
  }, [modelKey])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!input.trim() || isLoading) return

      // Add user message to chat
      const userMessage: ChatMessage = {
        role: "user",
        content: input,
      }

      setMessages((prev) => [...prev, userMessage])
      setInput("")
      setIsLoading(true)
      setError(null)

      try {
        // Add placeholder for assistant response
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: "",
        }

        setMessages((prev) => [...prev, assistantMessage])

        // Get all messages except the empty assistant message we just added
        const currentMessages = [...messages, userMessage]

        let fullResponse = ""

        await aiProvider.streamCompletion(
          currentMessages,
          undefined, // system prompt
          {
            onToken: (token) => {
              fullResponse += token
              setMessages((prev) => {
                const updatedMessages = [...prev]
                // Update the last message (assistant's response)
                updatedMessages[updatedMessages.length - 1] = {
                  role: "assistant",
                  content: fullResponse,
                }
                return updatedMessages
              })
            },
            onThinking: (thinking) => {
              onThinking?.(thinking)
            },
            onComplete: () => {
              onComplete?.()
            },
            onError: (err) => {
              setError(err)
            },
          },
        )
      } catch (err) {
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    },
    [input, isLoading, messages, aiProvider, onThinking, onComplete],
  )

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    clearMessages,
  }
}
