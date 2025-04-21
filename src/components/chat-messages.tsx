import type { ChatMessage } from "@/lib/ai-provider"
import { cn } from "@/lib/utils"
import { User, Bot } from "lucide-react"
import ReactMarkdown from "react-markdown"

interface ChatMessagesProps {
  messages: ChatMessage[]
}

export default function ChatMessages({ messages }: ChatMessagesProps) {
  return (
    <div className="space-y-6">
      {messages.map((message, index) => {
        // Skip system messages
        if (message.role === "system") return null

        const isUser = message.role === "user"
        const content =
          typeof message.content === "string"
            ? message.content
            : message.content
              .filter((part) => part.type === "text")
              .map((part) => (part as any).text)
              .join("")

        return (
          <div
            key={index}
            className={cn("flex items-start gap-4 p-4 rounded-lg", isUser ? "bg-muted/50" : "bg-background")}
          >
            <div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full shrink-0",
                isUser ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
              )}
            >
              {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="font-medium mb-1">{isUser ? "You" : "Assistant"}</div>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
