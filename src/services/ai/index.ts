// AI Service for Product AI Creator
// Simplified version without DB - uses env vars directly
// Provides vision analysis and content generation

import { GoogleAIAdapter } from './adapters/GoogleAIAdapter';
import { OpenRouterAdapter } from './adapters/OpenRouterAdapter';
import type { AICompletionRequest, AIVisionRequest, AICompletionResponse } from './adapters/BaseAdapter';

export type { AICompletionRequest, AIVisionRequest, AICompletionResponse };

// Singleton instances
let googleAdapter: GoogleAIAdapter | null = null;
let openRouterAdapter: OpenRouterAdapter | null = null;

function getGoogleAdapter(): GoogleAIAdapter {
  if (!googleAdapter) {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY is not set');
    }
    googleAdapter = new GoogleAIAdapter({ apiKey });
  }
  return googleAdapter;
}

function getOpenRouterAdapter(): OpenRouterAdapter {
  if (!openRouterAdapter) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is not set');
    }
    openRouterAdapter = new OpenRouterAdapter({ apiKey });
  }
  return openRouterAdapter;
}

/**
 * Analyze images using Google AI (Gemma 3)
 * Best for: product recognition, feature extraction
 */
export async function analyzeImages(
  images: Array<{ base64: string; mimeType: string }>,
  prompt: string,
  systemPrompt?: string
): Promise<AICompletionResponse> {
  const adapter = getGoogleAdapter();

  return adapter.completeWithVision({
    images,
    prompt,
    systemPrompt,
    model: 'gemma-3-27b-it',
    temperature: 0.3,
    maxTokens: 4000,
  });
}

/**
 * Generate text content using OpenRouter (Llama 3.3 70B)
 * Best for: product descriptions, SEO content
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
  const adapter = getOpenRouterAdapter();

  return adapter.complete({
    prompt,
    systemPrompt,
    model: options?.model || 'meta-llama/llama-3.3-70b-instruct:free',
    temperature: options?.temperature ?? 0.7,
    maxTokens: options?.maxTokens ?? 2000,
  });
}

/**
 * Generate text with fallback - tries OpenRouter first, falls back to Google AI
 */
export async function generateContentWithFallback(
  prompt: string,
  systemPrompt?: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
  }
): Promise<AICompletionResponse> {
  try {
    return await generateContent(prompt, systemPrompt, options);
  } catch (error) {
    console.warn('OpenRouter failed, falling back to Google AI:', error);

    const adapter = getGoogleAdapter();
    return adapter.complete({
      prompt,
      systemPrompt,
      model: 'gemma-3-27b-it',
      temperature: options?.temperature ?? 0.7,
      maxTokens: options?.maxTokens ?? 2000,
    });
  }
}

/**
 * Test AI provider connections
 */
export async function testConnections(): Promise<{
  google: { success: boolean; error?: string; latencyMs?: number };
  openRouter: { success: boolean; error?: string; latencyMs?: number };
}> {
  const results = await Promise.allSettled([
    getGoogleAdapter().testConnection(),
    getOpenRouterAdapter().testConnection(),
  ]);

  return {
    google: results[0].status === 'fulfilled'
      ? results[0].value
      : { success: false, error: (results[0] as PromiseRejectedResult).reason?.message },
    openRouter: results[1].status === 'fulfilled'
      ? results[1].value
      : { success: false, error: (results[1] as PromiseRejectedResult).reason?.message },
  };
}

/**
 * Get available models for each provider
 */
export function getAvailableModels(): {
  google: string[];
  openRouter: string[];
} {
  return {
    google: new GoogleAIAdapter({ apiKey: '' }).getAvailableModels(),
    openRouter: new OpenRouterAdapter({ apiKey: '' }).getAvailableModels(),
  };
}
