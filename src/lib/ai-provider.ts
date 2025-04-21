import { OpenAI } from 'openai';

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string | ContentPart[];
};

export type ContentPart = TextContent | ImageContent;

export interface TextContent {
  type: 'text';
  text: string;
}

export interface ImageContent {
  type: 'image_url';
  image_url: {
    url: string;
  };
}

export type AIStreamCallbacks = {
  onToken?: (token: string) => void;
  onThinking?: (thinking: string) => void;
  onComplete?: (completion: string) => void;
  onError?: (error: Error) => void;
};

export interface ModelMetadata {
  id: string;        // OpenRouter model ID
  name: string;      // Display name for frontend
  description: string; // Brief description
  capabilities: ModelCapabilities;
  iconUrl?: string;  // Optional icon URL for the UI
}

export interface ModelCapabilities {
  textInput: boolean;
  imageInput: boolean;
  thinking: boolean;
  contextWindow: number;
}

// Available model options with metadata
export const AIModels = {
  NOUS_DEEPHERMES: {
    id: "nousresearch/deephermes-3-llama-3-8b-preview:free",
    name: "DeepHermes 3",
    description: "Fast LLaMA 3-based model with strong reasoning",
    capabilities: {
      textInput: true,
      imageInput: false,
      thinking: true,
      contextWindow: 8192
    },
    iconUrl: "/icons/nous-icon.svg"  // Replace with actual path
  },
  MOONSHOT_KIMI: {
    id: "moonshotai/kimi-vl-a3b-thinking:free",
    name: "Kimi Vision",
    description: "Multimodal model that can understand images",
    capabilities: {
      textInput: true,
      imageInput: true,
      thinking: true,
      contextWindow: 4096
    },
    iconUrl: "/icons/moonshot-icon.svg"  // Replace with actual path
  }
} as const;

// Type for model keys
export type AIModelKey = keyof typeof AIModels;

export class AIProvider {
  private client: OpenAI;
  private currentModelKey: AIModelKey;

  constructor(modelKey: AIModelKey = 'NOUS_DEEPHERMES') {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is not defined in environment variables');
    }

    this.client = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: apiKey,
      defaultHeaders: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": process.env.NEXT_PUBLIC_SITE_NAME || "Facade",
      },
    });
    this.currentModelKey = modelKey;
  }

  // Get current model information
  getCurrentModel(): ModelMetadata {
    return AIModels[this.currentModelKey];
  }

  // Set the model by key
  setModel(modelKey: AIModelKey): void {
    this.currentModelKey = modelKey;
  }

  // Get all available models for UI display
  getAllModels(): Record<AIModelKey, ModelMetadata> {
    return AIModels;
  }

  // Check if current model supports image input
  supportsImages(): boolean {
    return AIModels[this.currentModelKey].capabilities.imageInput;
  }

  private parseThinkingContent(content: string): { thinking: string, response: string } {
    const thinkingMatch = content.match(/<think>([\s\S]*?)<\/think>/);
    const thinking = thinkingMatch ? thinkingMatch[1].trim() : '';

    const response = content.replace(/<think>[\s\S]*?<\/think>/, '').trim();

    return { thinking, response };
  }

  private async processStream(
    response: Response,
    callbacks: AIStreamCallbacks
  ): Promise<void> {
    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = '';
    let fullContent = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        buffer += chunk;

        // Process the buffer for complete SSE messages
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const json = JSON.parse(data);
              if (json.choices && json.choices[0]) {
                const content = json.choices[0].delta?.content || '';
                if (content) {
                  callbacks.onToken?.(content);
                  fullContent += content;

                  // Check if content contains thinking tags
                  const { thinking } = this.parseThinkingContent(fullContent);
                  if (thinking && callbacks.onThinking) {
                    callbacks.onThinking(thinking);
                  }
                }
              }
            } catch (error) {
              // Skip invalid JSON
            }
          }
        }
      }

      // Process the complete response
      const { thinking, response: finalResponse } = this.parseThinkingContent(fullContent);
      callbacks.onComplete?.(finalResponse);

    } catch (error) {
      callbacks.onError?.(error as Error);
    }
  }

  async streamCompletion(
    messages: ChatMessage[],
    systemPrompt?: string,
    callbacks: AIStreamCallbacks = {}
  ): Promise<void> {
    try {
      // Add special instruction to include thinking process
      const enhancedSystemPrompt = {
        role: 'system' as const,
        content: `${systemPrompt || ''}
        
When reasoning through a problem, please wrap your step-by-step thinking in <think> tags.
Example:
<think>
This is my reasoning process:
1. First, I need to understand the question
2. Then, I'll break it down into steps
3. Finally, I'll provide a clear answer
</think>

Your actual response will come after the thinking section.`
      };

      const enhancedMessages = systemPrompt
        ? [enhancedSystemPrompt, ...messages.filter(m => m.role !== 'system')]
        : [enhancedSystemPrompt, ...messages];

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.client.apiKey}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
          'X-Title': process.env.NEXT_PUBLIC_SITE_NAME || "AI Assistant",
        },
        body: JSON.stringify({
          model: AIModels[this.currentModelKey].id,
          messages: enhancedMessages,
          stream: true,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(`API error: ${JSON.stringify(error)}`);
      }

      await this.processStream(response, callbacks);
    } catch (error) {
      callbacks.onError?.(error as Error);
    }
  }

  // Method for non-streaming completion with support for multimodal input
  async getCompletion(
    messages: ChatMessage[],
    systemPrompt?: string,
  ): Promise<{ thinking: string, response: string }> {
    try {
      // Add special instruction for thinking
      const enhancedSystemPrompt = {
        role: 'system' as const,
        content: `${systemPrompt || ''}
        
When reasoning through a problem, please wrap your step-by-step thinking in <think> tags.
Example:
<think>
This is my reasoning process:
1. First, I need to understand the question
2. Then, I'll break it down into steps
3. Finally, I'll provide a clear answer
</think>

Your actual response will come after the thinking section.`
      };

      const enhancedMessages = systemPrompt
        ? [enhancedSystemPrompt, ...messages.filter(m => m.role !== 'system')]
        : [enhancedSystemPrompt, ...messages];

      const completion = await this.client.chat.completions.create({
        model: AIModels[this.currentModelKey].id,
        messages: enhancedMessages as any,
        temperature: 0.7,
      });

      const content = completion.choices[0].message.content || '';
      return this.parseThinkingContent(content);
    } catch (error) {
      console.error('Error getting completion:', error);
      throw error;
    }
  }
}

// Export a factory function for easy instantiation with specific model
export function createAIProvider(modelKey?: AIModelKey) {
  return new AIProvider(modelKey);
}
