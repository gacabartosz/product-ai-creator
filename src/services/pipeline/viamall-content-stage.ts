// ViaMall Content Stage - Generates product content in viaMall format
// Uses OpenRouter (Llama 3.3 70B) for text generation with ViaMall-specific prompts

import { generateContentWithFallback } from '@/services/ai';
import { buildViaMallContentPrompt, type ViaMallPromptData, type ViaMallContentResult } from '@/prompts/viamall-generation';
import { extractJsonFromMarkdown, safeJsonParse } from '@/lib/utils';
import { viamallXmlBuilder } from '@/adapters/prestashop/viamall-xml-builder';
import type { VisionAnalysis, StageResult } from '@/types/pipeline';

export interface ViaMallContentStageInput {
  visionAnalysis: VisionAnalysis;
  userHint?: string;
  rawData?: {
    ean?: string;
    priceGross?: number;
    brand?: string;
  };
  language: 'de' | 'pl';
  imageCount?: number;
}

export interface ViaMallContentGeneration {
  name: string;           // ViaMall format: [Brand] [Name] | [Benefit]
  shortDescription: string; // HTML with emoji bullets
  longDescription: string;  // Full HTML with sections
  slug: string;            // URL-friendly, no umlauts
  rawResponse?: string;    // Original AI response for debugging
}

export async function runViaMallContentStage(
  input: ViaMallContentStageInput
): Promise<StageResult<ViaMallContentGeneration>> {
  const startTime = Date.now();

  try {
    // Build prompt data from vision analysis
    const promptData: ViaMallPromptData = {
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
      language: input.language,
    };

    // Build prompts using ViaMall template
    const { systemPrompt, userPrompt } = buildViaMallContentPrompt(promptData);

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
    const parsed = safeJsonParse<Partial<ViaMallContentResult>>(jsonStr, {});

    // Generate fallback name if not provided
    const fallbackName = buildFallbackName(promptData);

    // Validate and normalize the response
    const contentGeneration: ViaMallContentGeneration = {
      name: parsed.name || fallbackName,
      shortDescription: parsed.shortDescription || buildFallbackShortDescription(promptData),
      longDescription: parsed.longDescription || buildFallbackLongDescription(promptData),
      slug: parsed.slug || viamallXmlBuilder.slugify(parsed.name || fallbackName),
      rawResponse: response.content,
    };

    // Ensure slug is properly formatted
    contentGeneration.slug = viamallXmlBuilder.slugify(contentGeneration.slug);

    return {
      status: 'completed',
      data: contentGeneration,
      durationMs: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      status: 'failed',
      error: `ViaMall content generation failed: ${errorMessage}`,
      durationMs: Date.now() - startTime,
    };
  }
}

// Build fallback product name in ViaMall format
function buildFallbackName(data: ViaMallPromptData): string {
  const parts: string[] = [];

  if (data.brand) {
    parts.push(data.brand);
  }

  parts.push(data.productType);

  if (data.colors.length > 0) {
    parts.push(data.colors[0]);
  }

  const benefit = data.language === 'de' ? 'Hochwertige Qualitat' : 'Wysoka jakosc';

  return `${parts.join(' ')} | ${benefit}`;
}

// Build fallback short description with emoji bullets
function buildFallbackShortDescription(data: ViaMallPromptData): string {
  const isGerman = data.language === 'de';

  const intro = isGerman
    ? `<p><strong>${data.productType} in erstklassiger Qualitat.</strong></p>`
    : `<p><strong>${data.productType} najwyzszej jakosci.</strong></p>`;

  const bullets: string[] = [];

  if (data.materials.length > 0) {
    const label = isGerman ? 'Material' : 'Material';
    bullets.push(`<p>✅ <strong>${label}:</strong> ${data.materials.join(', ')}</p>`);
  }

  if (data.colors.length > 0) {
    const label = isGerman ? 'Farbe' : 'Kolor';
    bullets.push(`<p>✅ <strong>${label}:</strong> ${data.colors.join(', ')}</p>`);
  }

  if (data.features.length > 0) {
    const feature = data.features[0];
    bullets.push(`<p>✅ <strong>${feature}</strong></p>`);
  }

  const qualityLabel = isGerman ? 'Qualitat' : 'Jakosc';
  const qualityText = isGerman ? 'Hochwertige Verarbeitung' : 'Wysoka jakosc wykonania';
  bullets.push(`<p>✅ <strong>${qualityLabel}:</strong> ${qualityText}</p>`);

  return intro + bullets.join('');
}

// Build fallback long description with sections
function buildFallbackLongDescription(data: ViaMallPromptData): string {
  const isGerman = data.language === 'de';

  const title = `<h2>${data.brand ? data.brand + ' ' : ''}${data.productType}</h2>`;

  const introText = isGerman
    ? `<p>Entdecken Sie dieses hochwertige ${data.productType}. Perfekt fur den taglichen Gebrauch.</p>`
    : `<p>Odkryj ten wysokiej jakosci ${data.productType}. Idealny do codziennego uzytku.</p>`;

  const featuresHeader = isGerman ? '<h3>Eigenschaften</h3>' : '<h3>Cechy produktu</h3>';

  const featuresList = data.features.length > 0
    ? `<ul>${data.features.map(f => `<li><strong>${f}</strong></li>`).join('')}</ul>`
    : '';

  const specsHeader = isGerman ? '<h3>Technische Daten</h3>' : '<h3>Dane techniczne</h3>';

  const specsRows: string[] = [];
  if (data.materials.length > 0) {
    specsRows.push(`<tr><td>${isGerman ? 'Material' : 'Material'}:</td><td>${data.materials.join(', ')}</td></tr>`);
  }
  if (data.colors.length > 0) {
    specsRows.push(`<tr><td>${isGerman ? 'Farbe' : 'Kolor'}:</td><td>${data.colors.join(', ')}</td></tr>`);
  }
  if (data.style) {
    specsRows.push(`<tr><td>${isGerman ? 'Stil' : 'Styl'}:</td><td>${data.style}</td></tr>`);
  }

  const specsTable = specsRows.length > 0
    ? `<table>${specsRows.join('')}</table>`
    : '';

  return title + introText + featuresHeader + featuresList + specsHeader + specsTable;
}
