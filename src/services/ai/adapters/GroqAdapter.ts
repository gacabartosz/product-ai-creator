// Groq Adapter - Ultra-fast inference
// Free tier: 30 RPM, 14,400 RPD, 6,000 tokens/min

import { BaseAdapter, AICompletionRequest, AICompletionResponse, ProviderConfig } from './BaseAdapter';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Updated 2026-01-06: Verified from API - actual model IDs
// Llama 3.1 8B has highest limit (14,400 RPD), others are 1,000 RPD
const GROQ_MODELS = [
  'llama-3.1-8b-instant',                         // 14,400 RPD - PRIMARY!
  'llama-3.3-70b-versatile',                      // 1,000 RPD
  'meta-llama/llama-4-maverick-17b-128e-instruct',// 1,000 RPD
  'meta-llama/llama-4-scout-17b-16e-instruct',    // 1,000 RPD
  'qwen/qwen3-32b',                               // 1,000 RPD
  'openai/gpt-oss-120b',                          // 1,000 RPD
  'openai/gpt-oss-20b',                           // 1,000 RPD
  'moonshotai/kimi-k2-instruct',                  // 1,000 RPD
];

export class GroqAdapter extends BaseAdapter {
  constructor(config: ProviderConfig) {
    super(
      {
        ...config,
        baseUrl: config.baseUrl || GROQ_API_URL,
        defaultModel: config.defaultModel || 'llama-3.3-70b-versatile',
        rateLimitRpm: config.rateLimitRpm || 30,
        rateLimitRpd: config.rateLimitRpd || 14400,
      },
      'Groq'
    );
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const startTime = Date.now();
    const model = request.model || this.config.defaultModel!;

    const messages: Array<{ role: string; content: string }> = [];

    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }

    messages.push({ role: 'user', content: request.prompt });

    const response = await this.fetchWithTimeout(
      this.config.baseUrl!,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: request.temperature ?? 0.3,
          max_tokens: request.maxTokens ?? 2000,
        }),
      },
      30000
    );

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
      throw new Error('Invalid Groq response format');
    }

    return {
      content: data.choices[0].message.content,
      model: data.model || model,
      tokensUsed: data.usage?.total_tokens,
      latencyMs,
      finishReason: data.choices[0].finish_reason,
    };
  }

  async testConnection(): Promise<{ success: boolean; error?: string; latencyMs?: number }> {
    try {
      const startTime = Date.now();

      const response = await this.fetchWithTimeout(
        this.config.baseUrl!,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: this.config.defaultModel,
            messages: [{ role: 'user', content: 'Say OK' }],
            max_tokens: 5,
          }),
        },
        15000
      );

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `${response.status}: ${errorText}` };
      }

      return { success: true, latencyMs };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  getAvailableModels(): string[] {
    return GROQ_MODELS;
  }
}
