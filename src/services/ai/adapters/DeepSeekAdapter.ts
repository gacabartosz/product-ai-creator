// DeepSeek Adapter - Excellent reasoning at low cost
// Budget tier: ~$0.0007/1K tokens

import { BaseAdapter, AICompletionRequest, AICompletionResponse, ProviderConfig } from './BaseAdapter';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

const DEEPSEEK_MODELS = [
  'deepseek-chat',
  'deepseek-coder',
  'deepseek-reasoner',
];

export class DeepSeekAdapter extends BaseAdapter {
  constructor(config: ProviderConfig) {
    super(
      {
        ...config,
        baseUrl: config.baseUrl || DEEPSEEK_API_URL,
        defaultModel: config.defaultModel || 'deepseek-chat',
        rateLimitRpm: config.rateLimitRpm || 60,
        rateLimitRpd: config.rateLimitRpd || 10000,
      },
      'DeepSeek'
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
      throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
      throw new Error('Invalid DeepSeek response format');
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
    return DEEPSEEK_MODELS;
  }
}
