// Base Adapter for AI Providers
// Extended for Product AI Creator with Vision support

export interface AICompletionRequest {
  prompt: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIVisionRequest extends AICompletionRequest {
  images: Array<{
    base64: string;
    mimeType: string;
  }>;
}

export interface AICompletionResponse {
  content: string;
  model: string;
  tokensUsed?: number;
  latencyMs: number;
  finishReason?: string;
}

export interface ProviderConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  rateLimitRpm?: number;
  rateLimitRpd?: number;
}

export abstract class BaseAdapter {
  protected config: ProviderConfig;
  protected providerName: string;

  constructor(config: ProviderConfig, providerName: string) {
    this.config = config;
    this.providerName = providerName;
  }

  abstract complete(request: AICompletionRequest): Promise<AICompletionResponse>;

  abstract testConnection(): Promise<{ success: boolean; error?: string; latencyMs?: number }>;

  abstract getAvailableModels(): string[];

  getProviderName(): string {
    return this.providerName;
  }

  // Check if adapter supports vision
  supportsVision(): boolean {
    return false;
  }

  // Vision completion - override in vision-capable adapters
  async completeWithVision(request: AIVisionRequest): Promise<AICompletionResponse> {
    throw new Error(`${this.providerName} does not support vision`);
  }

  protected async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeoutMs: number = 30000
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeout);
    }
  }

  protected isRateLimitError(error: unknown): boolean {
    if (error instanceof Error) {
      return (
        error.message?.includes('429') ||
        error.message?.includes('Rate limit') ||
        error.message?.includes('rate_limit') ||
        error.message?.includes('Too Many Requests')
      );
    }
    return false;
  }

  protected isQuotaError(error: unknown): boolean {
    if (error instanceof Error) {
      return (
        error.message?.includes('quota') ||
        error.message?.includes('insufficient_quota') ||
        error.message?.includes('billing')
      );
    }
    return false;
  }
}
