// OpenRouter Adapter - Aggregator for multiple models
// Free tier: 20 RPM, varies by model
// Best for content generation in Product AI Creator

import {
  BaseAdapter,
  AICompletionRequest,
  AICompletionResponse,
  ProviderConfig
} from './BaseAdapter';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Free models available on OpenRouter (2026 update)
const OPENROUTER_FREE_MODELS = [
  // Best for product content (fast, reliable)
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemma-3-12b-it:free',
  'google/gemma-3-27b-it:free',
  'mistralai/mistral-small-3.1-24b-instruct:free',
  // DeepSeek reasoning
  'deepseek/deepseek-r1-0528:free',
  'moonshotai/kimi-k2:free',
  // Qwen
  'qwen/qwen3-4b:free',
  'qwen/qwen3-coder:free',
  // OpenAI GPT-OSS
  'openai/gpt-oss-120b:free',
  'openai/gpt-oss-20b:free',
  // Others
  'nvidia/nemotron-3-nano-30b-a3b:free',
  'nvidia/nemotron-nano-12b-v2-vl:free',
  'tngtech/deepseek-r1t-chimera:free',
];

export class OpenRouterAdapter extends BaseAdapter {
  constructor(config: ProviderConfig) {
    super(
      {
        ...config,
        baseUrl: config.baseUrl || OPENROUTER_API_URL,
        defaultModel: config.defaultModel || 'meta-llama/llama-3.3-70b-instruct:free',
        rateLimitRpm: config.rateLimitRpm || 20,
        rateLimitRpd: config.rateLimitRpd || 200, // Varies by model
      },
      'OpenRouter'
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
          'HTTP-Referer': 'https://bartoszgaca.pl/product-ai-creator',
          'X-Title': 'Product AI Creator',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? 2000,
        }),
      },
      60000 // 60s timeout
    );

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
      throw new Error('Invalid OpenRouter response format');
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
            'HTTP-Referer': 'https://bartoszgaca.pl/product-ai-creator',
            'X-Title': 'Product AI Creator',
          },
          body: JSON.stringify({
            model: 'meta-llama/llama-3.3-70b-instruct:free',
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
    return OPENROUTER_FREE_MODELS;
  }
}
