"use client"

import { useState, useRef, useEffect } from "react"
import { useChat } from "@/hooks/use-chat"
import ChatInput from "@/components/chat-input"
import ChatMessages from "@/components/chat-messages"
import ModelSelector from "@/components/model-selector"
import { type AIModelKey, AIModels } from "@/lib/ai-provider"
import { ThinkingDisplay } from "@/components/thinking-display"
import { Button } from "@/components/ui/button"
import { Trash2, Settings } from "lucide-react"
import { toast } from "sonner"

export default function ChatInterface() {
  const [selectedModel, setSelectedModel] = useState<AIModelKey>("NOUS_DEEPHERMES")
  const [thinking, setThinking] = useState<string>("")
  const [showSettings, setShowSettings] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, input, handleInputChange, handleSubmit, isLoading, clearMessages, error } = useChat({
    modelKey: selectedModel,
    onThinking: (thinkingText) => {
      setThinking(thinkingText)
    },
    onComplete: () => {
      setThinking("")
    },
  })

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, thinking])

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Something went wrong")
    }
  }, [error])

  const handleModelChange = (modelKey: AIModelKey) => {
    setSelectedModel(modelKey)
  }

  const handleClearChat = () => {
    clearMessages()
    setThinking("")
  }

  return (
    <div className="flex flex-col h-screen max-h-screen">
      <header className="border-b p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Facade</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleClearChat}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {showSettings && (
        <div className="border-b p-4 bg-muted/20">
          <ModelSelector models={AIModels} selectedModel={selectedModel} onSelectModel={handleModelChange} />
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="max-w-md text-center space-y-4">
              <h2 className="text-2xl font-bold">Welcome to Facade</h2>
              <p className="text-muted-foreground">
                Start a conversation with the AI assistant. You can switch between different models using the settings
                button.
              </p>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {Object.entries(AIModels).map(([key, model]) => (
                  <Button
                    key={key}
                    variant="outline"
                    className="flex flex-col items-center justify-center p-4 h-auto"
                    onClick={() => {
                      setSelectedModel(key as AIModelKey)
                      handleInputChange({
                        target: { value: `Tell me about your capabilities as ${model.name}` },
                      } as any)
                      handleSubmit(new Event("submit") as any)
                    }}
                  >
                    <div className="font-medium">{model.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{model.description}</div>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <ChatMessages messages={messages} />
        )}

        {thinking && <ThinkingDisplay thinking={thinking} />}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t">
        <ChatInput
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
          selectedModel={AIModels[selectedModel]}
        />
      </div>
    </div>
  )
}

