"use client"

import type React from "react"

import type { FormEvent, ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, ImageIcon, Loader2 } from "lucide-react"
import type { ModelMetadata } from "@/lib/ai-provider"

interface ChatInputProps {
  input: string
  handleInputChange: (e: ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit: (e: FormEvent) => void
  isLoading: boolean
  selectedModel: ModelMetadata
}

export default function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  selectedModel,
}: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (input.trim()) {
        handleSubmit(e as unknown as FormEvent)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex items-end gap-2">
        <div className="relative flex-1">
          <Textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[60px] resize-none pr-12"
            disabled={isLoading}
          />
          {selectedModel.capabilities.imageInput && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="absolute right-12 bottom-2"
              disabled={isLoading}
            >
              <ImageIcon className="h-5 w-5" />
              <span className="sr-only">Attach image</span>
            </Button>
          )}
          <Button type="submit" size="icon" className="absolute right-2 bottom-2" disabled={isLoading || !input.trim()}>
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </div>
      <div className="mt-2 text-xs text-muted-foreground flex items-center">
        <span>Using {selectedModel.name}</span>
        {selectedModel.capabilities.imageInput && (
          <span className="ml-2 px-1.5 py-0.5 rounded-md bg-muted text-xs">Images supported</span>
        )}
      </div>
    </form>
  )
}
