// Validation Stage - Validates and enriches the final product
// Combines vision analysis + content generation + raw data into UnifiedProduct

import { UnifiedProductSchema, calculateNetPrice } from '@/types/unified-product';
import type { UnifiedProduct } from '@/types/unified-product';
import type {
  PipelineInput,
  VisionAnalysis,
  ContentGeneration,
  StageResult
} from '@/types/pipeline';

export interface ValidationStageInput {
  pipelineInput: PipelineInput;
  visionAnalysis: VisionAnalysis;
  contentGeneration: ContentGeneration;
}

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
}

export async function runValidationStage(
  input: ValidationStageInput
): Promise<StageResult<ValidationResult> & { product?: UnifiedProduct }> {
  const startTime = Date.now();

  try {
    const { pipelineInput, visionAnalysis, contentGeneration } = input;

    // Build the unified product from all sources
    const rawProduct = buildUnifiedProduct(
      pipelineInput,
      visionAnalysis,
      contentGeneration
    );

    // Validate with Zod schema
    const validationResult = UnifiedProductSchema.safeParse(rawProduct);

    if (!validationResult.success) {
      // Extract error messages (Zod v4 uses 'issues' property)
      const errors = validationResult.error.issues.map(
        e => `${e.path.join('.')}: ${e.message}`
      );

      return {
        status: 'failed',
        data: {
          isValid: false,
          errors,
        },
        error: `Validation failed: ${errors.join('; ')}`,
        durationMs: Date.now() - startTime,
      };
    }

    // Additional validation warnings
    const warnings: string[] = [];

    const product = validationResult.data;

    if (product.description.short.length < 50) {
      warnings.push('Short description might be too short for good SEO');
    }

    if (product.seo.keywords.length < 3) {
      warnings.push('Consider adding more SEO keywords');
    }

    if (product.images.length < 2) {
      warnings.push('Products with multiple images typically perform better');
    }

    if (!product.brand) {
      warnings.push('Brand is not specified - this may affect searchability');
    }

    return {
      status: 'completed',
      data: {
        isValid: true,
        warnings: warnings.length > 0 ? warnings : undefined,
      },
      product,
      durationMs: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      status: 'failed',
      error: `Validation failed: ${errorMessage}`,
      data: {
        isValid: false,
        errors: [errorMessage],
      },
      durationMs: Date.now() - startTime,
    };
  }
}

function buildUnifiedProduct(
  input: PipelineInput,
  vision: VisionAnalysis,
  content: ContentGeneration
): Partial<UnifiedProduct> {
  const rawData = input.rawData || {};

  // Determine pricing (default to 99.99 if no price provided)
  const priceGross = rawData.priceGross || 99.99;
  const vatRate = rawData.vatRate || 23;
  const priceNet = rawData.priceNet || calculateNetPrice(priceGross, vatRate);

  // Build images array
  const images = input.images.map((img, index) => ({
    url: img.url,
    alt: content.imageAlts[index] || `Product image ${index + 1}`,
    position: index,
  }));

  // Determine brand (priority: raw data > vision > content attributes)
  const brand = rawData.brand
    || vision.detectedBrand
    || content.attributes?.['Marka']
    || content.attributes?.['Brand']
    || undefined;

  // Build the product
  return {
    name: truncate(content.name, 128),
    description: {
      short: truncate(content.shortDescription, 500),
      long: content.longDescription,
      html: content.htmlDescription,
    },
    seo: {
      title: truncate(content.seoTitle, 70),
      description: truncate(content.seoDescription, 160),
      keywords: content.keywords,
    },
    pricing: {
      gross: priceGross,
      net: priceNet,
      currency: rawData.currency || 'PLN',
      vatRate,
    },
    attributes: content.attributes,
    categories: vision.suggestedCategories,
    images,
    identifiers: {
      ean: rawData.ean,
      sku: rawData.sku,
    },
    stock: {
      quantity: rawData.quantity ?? 1,
      availability: 'in_stock',
    },
    brand,
    manufacturer: rawData.manufacturer,
    condition: vision.condition || 'new',
    weight: rawData.weight,
    tags: content.tags,
    metadata: {
      visionConfidence: vision.confidence,
      generatedAt: new Date().toISOString(),
    },
  };
}

function truncate(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}
