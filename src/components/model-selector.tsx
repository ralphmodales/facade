"use client"

import type { AIModelKey, ModelMetadata } from "@/lib/ai-provider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

interface ModelSelectorProps {
  models: Record<AIModelKey, ModelMetadata>
  selectedModel: AIModelKey
  onSelectModel: (modelKey: AIModelKey) => void
}

export default function ModelSelector({ models, selectedModel, onSelectModel }: ModelSelectorProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Select AI Model</h2>
      <RadioGroup
        value={selectedModel}
        onValueChange={(value) => onSelectModel(value as AIModelKey)}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {Object.entries(models).map(([key, model]) => (
          <div
            key={key}
            className="flex items-start space-x-3 border rounded-lg p-4 hover:border-primary/50 transition-colors"
          >
            <RadioGroupItem value={key} id={key} className="mt-1" />
            <div className="flex-1">
              <Label htmlFor={key} className="text-base font-medium cursor-pointer">
                {model.name}
              </Label>
              <p className="text-sm text-muted-foreground mt-1">{model.description}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {model.capabilities.textInput && <span className="px-2 py-1 rounded-full bg-muted text-xs">Text</span>}
                {model.capabilities.imageInput && (
                  <span className="px-2 py-1 rounded-full bg-muted text-xs">Images</span>
                )}
                {model.capabilities.thinking && (
                  <span className="px-2 py-1 rounded-full bg-muted text-xs">Thinking</span>
                )}
                <span className="px-2 py-1 rounded-full bg-muted text-xs">
                  {model.capabilities.contextWindow.toLocaleString()} tokens
                </span>
              </div>
            </div>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
}
