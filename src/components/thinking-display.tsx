"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Brain } from "lucide-react"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"

interface ThinkingDisplayProps {
  thinking: string
}

export function ThinkingDisplay({ thinking }: ThinkingDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!thinking) return null

  return (
    <div className="border border-dashed border-yellow-500/50 rounded-lg p-4 bg-yellow-50/10">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm font-medium text-yellow-600">
          <Brain className="h-4 w-4" />
          <span>AI Thinking Process</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-8 px-2 text-yellow-600"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              <span className="text-xs">Hide</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              <span className="text-xs">Show</span>
            </>
          )}
        </Button>
      </div>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          isExpanded ? "max-h-96 overflow-y-auto" : "max-h-0",
        )}
      >
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown>{thinking}</ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
