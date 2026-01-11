// POST /api/pipeline
// Run the AI pipeline on a draft

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { runPipeline } from '@/services/pipeline';
import type { PipelineInput } from '@/types/pipeline';

export const runtime = 'nodejs';
export const maxDuration = 120; // 2 minutes for AI processing

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { draftId, options } = body;

    if (!draftId) {
      return NextResponse.json(
        { error: 'draftId is required' },
        { status: 400 }
      );
    }

    // Get draft with images
    const draft = await prisma.draft.findUnique({
      where: { id: draftId },
      include: { images: true },
    });

    if (!draft) {
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      );
    }

    if (draft.images.length === 0) {
      return NextResponse.json(
        { error: 'Draft has no images' },
        { status: 400 }
      );
    }

    // Update status to processing
    await prisma.draft.update({
      where: { id: draftId },
      data: { status: 'PROCESSING' },
    });

    try {
      // Extract language from rawData
      const rawData = draft.rawData as Record<string, unknown> | null;
      const language = (rawData?.language as string) || 'de';

      // Build pipeline input
      const pipelineInput: PipelineInput = {
        images: draft.images.map(img => ({
          url: img.url,
          mimeType: img.mimeType,
          filename: img.filename,
        })),
        userHint: draft.userHint || undefined,
        rawData: draft.rawData as PipelineInput['rawData'],
      };

      // Build pipeline options with language
      const pipelineOptions = {
        ...options,
        language: language as 'pl' | 'en' | 'de',
        useViaMallFormat: language === 'de' || language === 'pl',
      };

      // Run pipeline
      const result = await runPipeline(pipelineInput, pipelineOptions);

      // Update draft with results
      const updateData: Record<string, unknown> = {
        visionAnalysis: result.visionAnalysis.data || null,
      };

      if (result.status === 'completed' && result.product) {
        updateData.status = 'READY';
        updateData.product = result.product;
        updateData.errorMessage = null;
      } else if (result.status === 'partial') {
        updateData.status = 'READY';
        updateData.product = result.product || null;
        updateData.errorMessage = result.errors?.join('; ') || null;
      } else {
        updateData.status = 'FAILED';
        updateData.errorMessage = result.errors?.join('; ') || 'Pipeline failed';
      }

      const updatedDraft = await prisma.draft.update({
        where: { id: draftId },
        data: updateData,
        include: { images: true },
      });

      return NextResponse.json({
        success: result.status === 'completed',
        draft: updatedDraft,
        pipelineResult: {
          status: result.status,
          totalDurationMs: result.totalDurationMs,
          stages: {
            vision: {
              status: result.visionAnalysis.status,
              durationMs: result.visionAnalysis.durationMs,
            },
            content: {
              status: result.contentGeneration.status,
              durationMs: result.contentGeneration.durationMs,
            },
            validation: {
              status: result.validation.status,
              durationMs: result.validation.durationMs,
            },
          },
          errors: result.errors,
        },
      });
    } catch (pipelineError) {
      // Update draft status to failed
      await prisma.draft.update({
        where: { id: draftId },
        data: {
          status: 'FAILED',
          errorMessage: pipelineError instanceof Error
            ? pipelineError.message
            : 'Pipeline error',
        },
      });

      throw pipelineError;
    }
  } catch (error) {
    console.error('Pipeline error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
