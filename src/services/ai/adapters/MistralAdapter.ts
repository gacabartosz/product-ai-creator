// Mistral AI Adapter
// Free tier: ~1 RPM, 500 RPD (limited free tier)

import { BaseAdapter, AICompletionRequest, AICompletionResponse, ProviderConfig } from './BaseAdapter';

const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';

const MISTRAL_MODELS = [
  'mistral-small-latest',
  'mistral-medium-latest',
  'mistral-large-latest',
  'open-mistral-7b',
  'open-mixtral-8x7b',
  'open-mixtral-8x22b',
  'codestral-latest',
];

export class MistralAdapter extends BaseAdapter {
  constructor(config: ProviderConfig) {
    super(
      {
        ...config,
        baseUrl: config.baseUrl || MISTRAL_API_URL,
        defaultModel: config.defaultModel || 'mistral-small-latest',
        rateLimitRpm: config.rateLimitRpm || 1,
        rateLimitRpd: config.rateLimitRpd || 500,
      },
      'Mistral'
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
      throw new Error(`Mistral API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
      throw new Error('Invalid Mistral response format');
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
    return MISTRAL_MODELS;
  }
}
