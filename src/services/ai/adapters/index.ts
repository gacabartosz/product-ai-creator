// Export all adapters for Product AI Creator
// G.A.C.A. Multi-Provider Failover System
export * from './BaseAdapter';
export * from './GroqAdapter';
export * from './CerebrasAdapter';
export * from './GoogleAIAdapter';
export * from './MistralAdapter';
export * from './DeepSeekAdapter';
export * from './OpenRouterAdapter';

// Adapter factory
import { BaseAdapter, ProviderConfig } from './BaseAdapter';
import { GroqAdapter } from './GroqAdapter';
import { CerebrasAdapter } from './CerebrasAdapter';
import { GoogleAIAdapter } from './GoogleAIAdapter';
import { MistralAdapter } from './MistralAdapter';
import { DeepSeekAdapter } from './DeepSeekAdapter';
import { OpenRouterAdapter } from './OpenRouterAdapter';

export type ProviderType = 'groq' | 'cerebras' | 'google' | 'mistral' | 'deepseek' | 'openrouter';

export function createAdapter(type: ProviderType, config: ProviderConfig): BaseAdapter {
  switch (type) {
    case 'groq':
      return new GroqAdapter(config);
    case 'cerebras':
      return new CerebrasAdapter(config);
    case 'google':
      return new GoogleAIAdapter(config);
    case 'mistral':
      return new MistralAdapter(config);
    case 'deepseek':
      return new DeepSeekAdapter(config);
    case 'openrouter':
      return new OpenRouterAdapter(config);
    default:
      throw new Error(`Unknown provider type: ${type}`);
  }
}

// G.A.C.A. Provider configurations with priority order
// Lower priority number = higher preference
export const DEFAULT_PROVIDER_CONFIGS: Record<ProviderType, {
  priority: number;
  tier: string;
  name: string;
  defaultModel: string;
  rateLimitRpm: number;
  rateLimitRpd: number;
  supportsVision: boolean;
}> = {
  groq: {
    priority: 1,
    name: 'Groq',
    tier: 'FREE',
    defaultModel: 'llama-3.3-70b-versatile',
    rateLimitRpm: 30,
    rateLimitRpd: 14400,
    supportsVision: false,
  },
  cerebras: {
    priority: 2,
    name: 'Cerebras',
    tier: 'FREE',
    defaultModel: 'llama-3.3-70b',
    rateLimitRpm: 30,
    rateLimitRpd: 14400,
    supportsVision: false,
  },
  google: {
    priority: 3,
    name: 'Google AI Studio',
    tier: 'FREE',
    defaultModel: 'gemma-3-27b-it',
    rateLimitRpm: 30,
    rateLimitRpd: 14400,
    supportsVision: true,
  },
  mistral: {
    priority: 4,
    name: 'Mistral',
    tier: 'FREE',
    defaultModel: 'mistral-small-latest',
    rateLimitRpm: 1,
    rateLimitRpd: 500,
    supportsVision: false,
  },
  deepseek: {
    priority: 5,
    name: 'DeepSeek',
    tier: 'PAID',
    defaultModel: 'deepseek-chat',
    rateLimitRpm: 60,
    rateLimitRpd: 10000,
    supportsVision: false,
  },
  openrouter: {
    priority: 6,
    name: 'OpenRouter',
    tier: 'FREE',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct:free',
    rateLimitRpm: 20,
    rateLimitRpd: 200,
    supportsVision: false,
  },
};

// Get providers sorted by priority
export function getProvidersByPriority(): ProviderType[] {
  return (Object.keys(DEFAULT_PROVIDER_CONFIGS) as ProviderType[])
    .sort((a, b) => DEFAULT_PROVIDER_CONFIGS[a].priority - DEFAULT_PROVIDER_CONFIGS[b].priority);
}
