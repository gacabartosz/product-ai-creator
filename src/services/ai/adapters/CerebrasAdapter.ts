// Cerebras Adapter - Fast inference on custom hardware
// Free tier: 30 RPM, 14,400 RPD per model

import { BaseAdapter, AICompletionRequest, AICompletionResponse, ProviderConfig } from './BaseAdapter';

const CEREBRAS_API_URL = 'https://api.cerebras.ai/v1/chat/completions';

// Verified from API 2026-01-06 - actual model IDs
const CEREBRAS_MODELS = [
  'llama-3.3-70b',                    // 14,400 RPD
  'llama3.1-8b',                      // 14,400 RPD
  'qwen-3-235b-a22b-instruct-2507',   // 14,400 RPD - huge model!
  'qwen-3-32b',                       // 14,400 RPD
  'gpt-oss-120b',                     // 14,400 RPD
  'zai-glm-4.6',                      // Z.ai model
];

export class CerebrasAdapter extends BaseAdapter {
  constructor(config: ProviderConfig) {
    super(
      {
        ...config,
        baseUrl: config.baseUrl || CEREBRAS_API_URL,
        defaultModel: config.defaultModel || 'llama-3.3-70b',
        rateLimitRpm: config.rateLimitRpm || 30,
        rateLimitRpd: config.rateLimitRpd || 14400,
      },
      'Cerebras'
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
      throw new Error(`Cerebras API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
      throw new Error('Invalid Cerebras response format');
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
    return CEREBRAS_MODELS;
  }
}
