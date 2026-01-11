// Pipeline Orchestrator for Product AI Creator
// Chains: Vision Stage → Content Stage → Validation Stage

import { runVisionStage, urlsToBase64, type VisionStageInput } from './vision-stage';
import { runContentStage, type ContentStageInput } from './content-stage';
import { runViaMallContentStage, type ViaMallContentStageInput, type ViaMallContentGeneration } from './viamall-content-stage';
import { runValidationStage, type ValidationStageInput } from './validation-stage';
import type {
  PipelineInput,
  PipelineOutput,
  PipelineOptions,
  VisionAnalysis,
  ContentGeneration,
  StageResult,
} from '@/types/pipeline';
import type { UnifiedProduct } from '@/types/unified-product';

export {
  runVisionStage,
  runContentStage,
  runViaMallContentStage,
  runValidationStage,
  urlsToBase64,
};

export type {
  VisionStageInput,
  ContentStageInput,
  ViaMallContentStageInput,
  ViaMallContentGeneration,
  ValidationStageInput,
};

/**
 * Run the full product creation pipeline
 *
 * @param input - Pipeline input (images, hints, raw data)
 * @param options - Pipeline options (skip stages, custom prompts, etc.)
 * @returns Pipeline output with final product or errors
 */
export async function runPipeline(
  input: PipelineInput,
  options: PipelineOptions = {}
): Promise<PipelineOutput> {
  const startTime = Date.now();
  const errors: string[] = [];

  const { onProgress, language = 'pl', useViaMallFormat = false } = options;

  // Initialize results
  let visionResult: StageResult<VisionAnalysis> = {
    status: 'pending',
    durationMs: 0,
  };

  let contentResult: StageResult<ContentGeneration> = {
    status: 'pending',
    durationMs: 0,
  };

  let validationResult: StageResult<{ isValid: boolean; errors?: string[] }> = {
    status: 'pending',
    durationMs: 0,
  };

  let finalProduct: UnifiedProduct | undefined;

  // Stage 1: Vision Analysis
  if (!options.skipVision) {
    onProgress?.({
      stage: 'vision',
      status: 'running',
      message: 'Analyzing images...',
      progress: 10,
    });

    try {
      // Convert image URLs to base64
      const imageUrls = input.images.map(img => img.url);
      const imagesBase64 = await urlsToBase64(imageUrls);

      const visionInput: VisionStageInput = {
        images: imagesBase64,
        userHint: input.userHint,
        language,
      };

      visionResult = await runVisionStage(visionInput);

      if (visionResult.status === 'failed') {
        errors.push(visionResult.error || 'Vision analysis failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      visionResult = {
        status: 'failed',
        error: errorMessage,
        durationMs: Date.now() - startTime,
      };
      errors.push(`Vision stage error: ${errorMessage}`);
    }

    onProgress?.({
      stage: 'vision',
      status: visionResult.status,
      message: visionResult.status === 'completed'
        ? 'Image analysis complete'
        : visionResult.error,
      progress: 33,
    });
  } else {
    visionResult = {
      status: 'skipped',
      durationMs: 0,
    };
  }

  // Stage 2: Content Generation
  if (visionResult.status === 'completed' && visionResult.data && !options.skipContent) {
    onProgress?.({
      stage: 'content',
      status: 'running',
      message: useViaMallFormat ? 'Generating ViaMall content...' : 'Generating product content...',
      progress: 40,
    });

    try {
      if (useViaMallFormat && (language === 'de' || language === 'pl')) {
        // Use ViaMall content stage for DE/PL languages
        const viamallInput: ViaMallContentStageInput = {
          visionAnalysis: visionResult.data,
          userHint: input.userHint,
          rawData: input.rawData,
          language: language as 'de' | 'pl',
          imageCount: input.images.length,
        };

        const viamallResult = await runViaMallContentStage(viamallInput);

        // Convert ViaMall result to standard ContentGeneration format
        if (viamallResult.status === 'completed' && viamallResult.data) {
          contentResult = {
            status: 'completed',
            data: {
              name: viamallResult.data.name,
              shortDescription: viamallResult.data.shortDescription,
              longDescription: viamallResult.data.longDescription,
              htmlDescription: viamallResult.data.longDescription,
              seoTitle: viamallResult.data.name.slice(0, 70),
              seoDescription: viamallResult.data.shortDescription.replace(/<[^>]*>/g, '').slice(0, 160),
              keywords: [],
              attributes: {},
              tags: [],
              imageAlts: [],
              rawResponse: viamallResult.data.rawResponse,
              // Store ViaMall-specific data
              viamallSlug: viamallResult.data.slug,
            } as ContentGeneration & { viamallSlug?: string },
            durationMs: viamallResult.durationMs,
          };
        } else {
          contentResult = {
            status: viamallResult.status,
            error: viamallResult.error,
            durationMs: viamallResult.durationMs,
          };
        }
      } else {
        // Use standard content stage
        const contentInput: ContentStageInput = {
          visionAnalysis: visionResult.data,
          userHint: input.userHint,
          rawData: input.rawData,
          language,
          imageCount: input.images.length,
        };

        contentResult = await runContentStage(contentInput);
      }

      if (contentResult.status === 'failed') {
        errors.push(contentResult.error || 'Content generation failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      contentResult = {
        status: 'failed',
        error: errorMessage,
        durationMs: Date.now() - startTime,
      };
      errors.push(`Content stage error: ${errorMessage}`);
    }

    onProgress?.({
      stage: 'content',
      status: contentResult.status,
      message: contentResult.status === 'completed'
        ? 'Content generation complete'
        : contentResult.error,
      progress: 66,
    });
  } else if (!options.skipContent) {
    contentResult = {
      status: 'skipped',
      durationMs: 0,
    };
  }

  // Stage 3: Validation
  if (
    visionResult.status === 'completed' &&
    contentResult.status === 'completed' &&
    visionResult.data &&
    contentResult.data
  ) {
    onProgress?.({
      stage: 'validation',
      status: 'running',
      message: 'Validating product data...',
      progress: 80,
    });

    try {
      const validationInput: ValidationStageInput = {
        pipelineInput: input,
        visionAnalysis: visionResult.data,
        contentGeneration: contentResult.data,
      };

      const result = await runValidationStage(validationInput);
      validationResult = {
        status: result.status,
        data: result.data,
        error: result.error,
        durationMs: result.durationMs,
      };
      finalProduct = result.product;

      if (validationResult.status === 'failed') {
        errors.push(validationResult.error || 'Validation failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      validationResult = {
        status: 'failed',
        error: errorMessage,
        data: { isValid: false, errors: [errorMessage] },
        durationMs: Date.now() - startTime,
      };
      errors.push(`Validation stage error: ${errorMessage}`);
    }

    onProgress?.({
      stage: 'validation',
      status: validationResult.status,
      message: validationResult.status === 'completed'
        ? 'Validation complete'
        : validationResult.error,
      progress: 100,
    });
  }

  // Determine overall status
  const totalDurationMs = Date.now() - startTime;

  let status: PipelineOutput['status'];
  if (finalProduct && validationResult.status === 'completed') {
    status = 'completed';
  } else if (
    visionResult.status === 'completed' ||
    contentResult.status === 'completed'
  ) {
    status = 'partial';
  } else {
    status = 'failed';
  }

  return {
    visionAnalysis: visionResult,
    contentGeneration: contentResult,
    validation: validationResult,
    product: finalProduct,
    status,
    totalDurationMs,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Run only the vision analysis stage
 */
export async function analyzeProductImages(
  imageUrls: string[],
  userHint?: string
): Promise<StageResult<VisionAnalysis>> {
  const imagesBase64 = await urlsToBase64(imageUrls);
  return runVisionStage({
    images: imagesBase64,
    userHint,
  });
}
