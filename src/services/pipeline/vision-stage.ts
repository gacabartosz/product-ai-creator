// Vision Stage - Analyzes product images using AI
// Uses Google AI (Gemma 3) for multi-modal analysis

import { analyzeImages } from '@/services/ai';
import { VISION_SYSTEM_PROMPT, buildVisionPrompt } from '@/prompts/vision-analysis';
import { extractJsonFromMarkdown, safeJsonParse } from '@/lib/utils';
import type { VisionAnalysis, StageResult } from '@/types/pipeline';

export interface VisionStageInput {
  images: Array<{
    base64: string;
    mimeType: string;
  }>;
  userHint?: string;
  language?: 'pl' | 'en' | 'de';
}

export async function runVisionStage(
  input: VisionStageInput
): Promise<StageResult<VisionAnalysis>> {
  const startTime = Date.now();

  try {
    // Build the prompt
    const prompt = buildVisionPrompt(input.userHint);

    // Call the AI service
    const response = await analyzeImages(
      input.images,
      prompt,
      VISION_SYSTEM_PROMPT
    );

    // Parse the response
    const jsonStr = extractJsonFromMarkdown(response.content);
    const parsed = safeJsonParse<Partial<VisionAnalysis>>(jsonStr, {});

    // Validate and normalize the response
    const visionAnalysis: VisionAnalysis = {
      productType: parsed.productType || 'Unknown Product',
      detectedBrand: parsed.detectedBrand || undefined,
      detectedModel: parsed.detectedModel || undefined,
      colors: Array.isArray(parsed.colors) ? parsed.colors : [],
      materials: Array.isArray(parsed.materials) ? parsed.materials : [],
      style: parsed.style || undefined,
      condition: isValidCondition(parsed.condition) ? parsed.condition : undefined,
      features: Array.isArray(parsed.features) ? parsed.features : [],
      suggestedCategories: Array.isArray(parsed.suggestedCategories)
        ? parsed.suggestedCategories
        : [],
      confidence: typeof parsed.confidence === 'number'
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0.5,
      rawResponse: response.content,
    };

    return {
      status: 'completed',
      data: visionAnalysis,
      durationMs: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      status: 'failed',
      error: `Vision analysis failed: ${errorMessage}`,
      durationMs: Date.now() - startTime,
    };
  }
}

function isValidCondition(value: unknown): value is 'new' | 'used' | 'refurbished' {
  return value === 'new' || value === 'used' || value === 'refurbished';
}

// Helper to convert image URL to base64
export async function urlToBase64(
  url: string
): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || 'image/jpeg';
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');

  return {
    base64,
    mimeType: contentType,
  };
}

// Convert multiple URLs to base64
export async function urlsToBase64(
  urls: string[]
): Promise<Array<{ base64: string; mimeType: string }>> {
  return Promise.all(urls.map(urlToBase64));
}
