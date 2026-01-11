// POST /api/publish/[id]
// Publish a draft to a platform

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAdapter, type Platform, type PublishOptions } from '@/adapters';
import type { UnifiedProduct } from '@/types/unified-product';

export const runtime = 'nodejs';
export const maxDuration = 60; // 1 minute for publishing

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { platform, options } = body as {
      platform: Platform;
      options?: PublishOptions;
    };

    if (!platform) {
      return NextResponse.json(
        { error: 'platform is required' },
        { status: 400 }
      );
    }

    // Get draft with product data
    const draft = await prisma.draft.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!draft) {
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      );
    }

    if (draft.status !== 'READY' && draft.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: `Cannot publish draft with status: ${draft.status}. Must be READY or PUBLISHED.` },
        { status: 400 }
      );
    }

    if (!draft.product) {
      return NextResponse.json(
        { error: 'Draft has no product data. Run the pipeline first.' },
        { status: 400 }
      );
    }

    // Get platform config from database or environment
    const platformConfig = await prisma.platformConfig.findUnique({
      where: { platform },
    });

    if (!platformConfig) {
      // Try environment variables
      const envUrl = process.env[`${platform.toUpperCase()}_URL`];
      const envKey = process.env[`${platform.toUpperCase()}_API_KEY`];

      if (!envUrl || !envKey) {
        return NextResponse.json(
          { error: `Platform ${platform} is not configured` },
          { status: 400 }
        );
      }
    }

    // Create adapter
    const adapter = createAdapter({
      platform,
      apiUrl: platformConfig?.apiUrl || process.env[`${platform.toUpperCase()}_URL`]!,
      apiKey: platformConfig?.apiKey || process.env[`${platform.toUpperCase()}_API_KEY`]!,
      settings: platformConfig?.settings as Record<string, unknown> | undefined,
    });

    // Test connection first
    const connectionTest = await adapter.testConnection();
    if (!connectionTest.success) {
      return NextResponse.json(
        { error: `Failed to connect to ${platform}: ${connectionTest.error}` },
        { status: 500 }
      );
    }

    // Publish product
    const product = draft.product as unknown as UnifiedProduct;
    const publishResult = await adapter.publishProduct(product, options);

    // Create publish log
    const publishLog = await prisma.publishLog.create({
      data: {
        draftId: id,
        platform,
        status: publishResult.success ? 'success' : 'failed',
        externalId: publishResult.externalId,
        externalUrl: publishResult.externalUrl,
        response: publishResult.response as object | undefined,
        errorMessage: publishResult.error,
      },
    });

    // Update draft status if first successful publish
    if (publishResult.success && draft.status !== 'PUBLISHED') {
      await prisma.draft.update({
        where: { id },
        data: { status: 'PUBLISHED' },
      });
    }

    return NextResponse.json({
      success: publishResult.success,
      publishLog,
      externalId: publishResult.externalId,
      externalUrl: publishResult.externalUrl,
      error: publishResult.error,
    });
  } catch (error) {
    console.error('Publish error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
