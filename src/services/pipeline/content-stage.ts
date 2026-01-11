// Content Stage - Generates product content using AI
// Uses OpenRouter (Llama 3.3 70B) for text generation

import { generateContentWithFallback } from '@/services/ai';
import { buildContentPrompt, type ContentPromptData } from '@/prompts/product-generation';
import { extractJsonFromMarkdown, safeJsonParse } from '@/lib/utils';
import type { VisionAnalysis, ContentGeneration, StageResult } from '@/types/pipeline';

export interface ContentStageInput {
  visionAnalysis: VisionAnalysis;
  userHint?: string;
  rawData?: {
    ean?: string;
    priceGross?: number;
    brand?: string;
  };
  language?: 'pl' | 'en' | 'de';
  imageCount?: number;
}

export async function runContentStage(
  input: ContentStageInput
): Promise<StageResult<ContentGeneration>> {
  const startTime = Date.now();

  try {
    // Build prompt data from vision analysis
    const promptData: ContentPromptData = {
      productType: input.visionAnalysis.productType,
      brand: input.visionAnalysis.detectedBrand || input.rawData?.brand,
      model: input.visionAnalysis.detectedModel,
      colors: input.visionAnalysis.colors,
      materials: input.visionAnalysis.materials,
      style: input.visionAnalysis.style,
      features: input.visionAnalysis.features,
      categories: input.visionAnalysis.suggestedCategories,
      userHint: input.userHint,
      rawData: input.rawData,
      language: input.language || 'pl',
      imageCount: input.imageCount,
    };

    // Build prompts
    const { systemPrompt, userPrompt } = buildContentPrompt(promptData);

    // Call the AI service
    const response = await generateContentWithFallback(
      userPrompt,
      systemPrompt,
      {
        temperature: 0.7,
        maxTokens: 3000,
      }
    );

    // Parse the response
    const jsonStr = extractJsonFromMarkdown(response.content);
    const parsed = safeJsonParse<Partial<ContentGeneration>>(jsonStr, {});

    // Validate and normalize the response
    const contentGeneration: ContentGeneration = {
      name: parsed.name || `${promptData.brand || ''} ${promptData.productType}`.trim(),
      shortDescription: parsed.shortDescription || '',
      longDescription: parsed.longDescription || '',
      htmlDescription: parsed.htmlDescription || formatAsHtml(parsed.longDescription || ''),
      seoTitle: parsed.seoTitle || parsed.name || '',
      seoDescription: parsed.seoDescription || parsed.shortDescription || '',
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      attributes: typeof parsed.attributes === 'object' && parsed.attributes
        ? parsed.attributes
        : buildDefaultAttributes(input.visionAnalysis),
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      imageAlts: Array.isArray(parsed.imageAlts)
        ? parsed.imageAlts
        : generateDefaultImageAlts(input.imageCount || 1, parsed.name || promptData.productType),
      rawResponse: response.content,
    };

    return {
      status: 'completed',
      data: contentGeneration,
      durationMs: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      status: 'failed',
      error: `Content generation failed: ${errorMessage}`,
      durationMs: Date.now() - startTime,
    };
  }
}

// Helper to format plain text as HTML
function formatAsHtml(text: string): string {
  if (!text) return '';

  // If already has HTML tags, return as is
  if (text.includes('<p>') || text.includes('<ul>')) {
    return text;
  }

  // Split into paragraphs and wrap
  const paragraphs = text.split(/\n\n+/);
  return paragraphs
    .map(p => `<p>${p.trim()}</p>`)
    .join('\n');
}

// Build default attributes from vision analysis
function buildDefaultAttributes(vision: VisionAnalysis): Record<string, string> {
  const attrs: Record<string, string> = {};

  if (vision.colors.length > 0) {
    attrs['Kolor'] = vision.colors[0];
    if (vision.colors.length > 1) {
      attrs['Kolory dodatkowe'] = vision.colors.slice(1).join(', ');
    }
  }

  if (vision.materials.length > 0) {
    attrs['Materiał'] = vision.materials.join(', ');
  }

  if (vision.style) {
    attrs['Styl'] = vision.style;
  }

  if (vision.detectedBrand) {
    attrs['Marka'] = vision.detectedBrand;
  }

  if (vision.condition) {
    const conditionMap = {
      new: 'Nowy',
      used: 'Używany',
      refurbished: 'Odnowiony',
    };
    attrs['Stan'] = conditionMap[vision.condition];
  }

  return attrs;
}

// Generate default image alt texts
function generateDefaultImageAlts(count: number, productName: string): string[] {
  const alts: string[] = [];

  for (let i = 0; i < count; i++) {
    if (i === 0) {
      alts.push(`${productName} - widok główny`);
    } else if (i === 1) {
      alts.push(`${productName} - widok z boku`);
    } else if (i === 2) {
      alts.push(`${productName} - szczegół`);
    } else {
      alts.push(`${productName} - zdjęcie ${i + 1}`);
    }
  }

  return alts;
}
