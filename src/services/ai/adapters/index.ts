// Export all adapters for Product AI Creator
export * from './BaseAdapter';
export * from './GoogleAIAdapter';
export * from './OpenRouterAdapter';

// Adapter factory
import { BaseAdapter, ProviderConfig } from './BaseAdapter';
import { GoogleAIAdapter } from './GoogleAIAdapter';
import { OpenRouterAdapter } from './OpenRouterAdapter';

export type ProviderType = 'google' | 'openrouter';

export function createAdapter(type: ProviderType, config: ProviderConfig): BaseAdapter {
  switch (type) {
    case 'google':
      return new GoogleAIAdapter(config);
    case 'openrouter':
      return new OpenRouterAdapter(config);
    default:
      throw new Error(`Unknown provider type: ${type}`);
  }
}

// Default provider configurations
export const DEFAULT_PROVIDER_CONFIGS: Record<ProviderType, {
  tier: string;
  name: string;
  defaultModel: string;
  rateLimitRpm: number;
  rateLimitRpd: number;
  supportsVision: boolean;
}> = {
  google: {
    name: 'Google AI Studio',
    tier: 'FREE',
    defaultModel: 'gemma-3-27b-it',
    rateLimitRpm: 30,
    rateLimitRpd: 14400,
    supportsVision: true,
  },
  openrouter: {
    name: 'OpenRouter',
    tier: 'FREE',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct:free',
    rateLimitRpm: 20,
    rateLimitRpd: 200,
    supportsVision: false,
  },
};
