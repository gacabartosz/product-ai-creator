// AI Service for Product AI Creator
// G.A.C.A. Multi-Provider Failover System
// Automatically switches to next provider when rate limits are hit

import { GroqAdapter } from './adapters/GroqAdapter';
import { CerebrasAdapter } from './adapters/CerebrasAdapter';
import { GoogleAIAdapter } from './adapters/GoogleAIAdapter';
import { MistralAdapter } from './adapters/MistralAdapter';
import { DeepSeekAdapter } from './adapters/DeepSeekAdapter';
import { OpenRouterAdapter } from './adapters/OpenRouterAdapter';
import { BaseAdapter } from './adapters/BaseAdapter';
import { ProviderType, DEFAULT_PROVIDER_CONFIGS, getProvidersByPriority } from './adapters';
import type { AICompletionRequest, AIVisionRequest, AICompletionResponse } from './adapters/BaseAdapter';

export type { AICompletionRequest, AIVisionRequest, AICompletionResponse };

// Singleton adapter instances
const adapters: Map<ProviderType, BaseAdapter> = new Map();

// Get or create adapter
function getAdapter(type: ProviderType): BaseAdapter | null {
  if (adapters.has(type)) {
    return adapters.get(type)!;
  }

  const envKeyMap: Record<ProviderType, string> = {
    groq: 'GROQ_API_KEY',
    cerebras: 'CEREBRAS_API_KEY',
    google: 'GOOGLE_AI_API_KEY',
    mistral: 'MISTRAL_API_KEY',
    deepseek: 'DEEPSEEK_API_KEY',
    openrouter: 'OPENROUTER_API_KEY',
  };

  const apiKey = process.env[envKeyMap[type]];
  if (!apiKey) {
    return null;
  }

  let adapter: BaseAdapter;
  switch (type) {
    case 'groq':
      adapter = new GroqAdapter({ apiKey });
      break;
    case 'cerebras':
      adapter = new CerebrasAdapter({ apiKey });
      break;
    case 'google':
      adapter = new GoogleAIAdapter({ apiKey });
      break;
    case 'mistral':
      adapter = new MistralAdapter({ apiKey });
      break;
    case 'deepseek':
      adapter = new DeepSeekAdapter({ apiKey });
      break;
    case 'openrouter':
      adapter = new OpenRouterAdapter({ apiKey });
      break;
  }

  adapters.set(type, adapter);
  return adapter;
}

// Get all available adapters sorted by priority
function getAvailableAdapters(): Array<{ type: ProviderType; adapter: BaseAdapter }> {
  const providers = getProvidersByPriority();
  const available: Array<{ type: ProviderType; adapter: BaseAdapter }> = [];

  for (const type of providers) {
    const adapter = getAdapter(type);
    if (adapter) {
      available.push({ type, adapter });
    }
  }

  return available;
}

// Get vision-capable adapters
function getVisionAdapters(): Array<{ type: ProviderType; adapter: BaseAdapter }> {
  return getAvailableAdapters().filter(({ adapter }) => adapter.supportsVision());
}

/**
 * Generate content with G.A.C.A. failover
 * Tries each provider in priority order until one succeeds
 */
export async function generateContent(
  prompt: string,
  systemPrompt?: string,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<AICompletionResponse> {
  const availableAdapters = getAvailableAdapters();

  if (availableAdapters.length === 0) {
    throw new Error('No AI providers configured. Check your API keys in .env');
  }

  const errors: string[] = [];

  for (const { type, adapter } of availableAdapters) {
    try {
      console.log(`[G.A.C.A.] Trying ${adapter.getProviderName()}...`);

      const result = await adapter.complete({
        prompt,
        systemPrompt,
        model: options?.model,
        temperature: options?.temperature ?? 0.7,
        maxTokens: options?.maxTokens ?? 2000,
      });

      console.log(`[G.A.C.A.] Success with ${adapter.getProviderName()} (${result.latencyMs}ms)`);
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`[G.A.C.A.] ${adapter.getProviderName()} failed: ${errorMsg}`);
      errors.push(`${type}: ${errorMsg}`);

      // Continue to next provider
      continue;
    }
  }

  throw new Error(`All AI providers failed:\n${errors.join('\n')}`);
}

/**
 * Analyze images using vision-capable provider (Google AI)
 * Falls back to other vision providers if available
 */
export async function analyzeImages(
  images: Array<{ base64: string; mimeType: string }>,
  prompt: string,
  systemPrompt?: string
): Promise<AICompletionResponse> {
  const visionAdapters = getVisionAdapters();

  if (visionAdapters.length === 0) {
    throw new Error('No vision-capable AI providers configured. Add GOOGLE_AI_API_KEY to .env');
  }

  const errors: string[] = [];

  for (const { type, adapter } of visionAdapters) {
    try {
      console.log(`[G.A.C.A. Vision] Trying ${adapter.getProviderName()}...`);

      const result = await adapter.completeWithVision({
        images,
        prompt,
        systemPrompt,
        model: 'gemma-3-27b-it',
        temperature: 0.3,
        maxTokens: 4000,
      });

      console.log(`[G.A.C.A. Vision] Success with ${adapter.getProviderName()} (${result.latencyMs}ms)`);
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`[G.A.C.A. Vision] ${adapter.getProviderName()} failed: ${errorMsg}`);
      errors.push(`${type}: ${errorMsg}`);
      continue;
    }
  }

  throw new Error(`All vision providers failed:\n${errors.join('\n')}`);
}

/**
 * Generate content with fallback (legacy compatibility)
 */
export async function generateContentWithFallback(
  prompt: string,
  systemPrompt?: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
  }
): Promise<AICompletionResponse> {
  return generateContent(prompt, systemPrompt, options);
}

/**
 * Test all AI provider connections
 */
export async function testConnections(): Promise<Record<ProviderType, {
  success: boolean;
  error?: string;
  latencyMs?: number;
  configured: boolean;
}>> {
  const providers = getProvidersByPriority();
  const results: Record<string, { success: boolean; error?: string; latencyMs?: number; configured: boolean }> = {};

  await Promise.all(
    providers.map(async (type) => {
      const adapter = getAdapter(type);

      if (!adapter) {
        results[type] = { success: false, configured: false, error: 'API key not configured' };
        return;
      }

      try {
        const testResult = await adapter.testConnection();
        results[type] = { ...testResult, configured: true };
      } catch (error) {
        results[type] = {
          success: false,
          configured: true,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    })
  );

  return results as Record<ProviderType, { success: boolean; error?: string; latencyMs?: number; configured: boolean }>;
}

/**
 * Get available models for all configured providers
 */
export function getAvailableModels(): Record<ProviderType, string[]> {
  const result: Partial<Record<ProviderType, string[]>> = {};

  for (const { type, adapter } of getAvailableAdapters()) {
    result[type] = adapter.getAvailableModels();
  }

  return result as Record<ProviderType, string[]>;
}

/**
 * Get provider status for UI display
 */
export function getProviderStatus(): Array<{
  type: ProviderType;
  name: string;
  priority: number;
  tier: string;
  configured: boolean;
  supportsVision: boolean;
}> {
  const providers = getProvidersByPriority();

  return providers.map(type => ({
    type,
    name: DEFAULT_PROVIDER_CONFIGS[type].name,
    priority: DEFAULT_PROVIDER_CONFIGS[type].priority,
    tier: DEFAULT_PROVIDER_CONFIGS[type].tier,
    configured: !!getAdapter(type),
    supportsVision: DEFAULT_PROVIDER_CONFIGS[type].supportsVision,
  }));
}
