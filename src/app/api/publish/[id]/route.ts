// POST /api/publish/[id]
// Publish a draft to a platform

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAdapter, type Platform, type PublishOptions } from '@/adapters';
import { PrestaShopApiClient } from '@/adapters/prestashop/api-client';
import type { UnifiedProduct } from '@/types/unified-product';

// Language ISO code to PrestaShop ID mapping cache
const languageIdCache: Map<string, string> = new Map();

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

    // Build final publish options with languageId
    let finalOptions: PublishOptions = { ...options };

    // Map language isoCode to PrestaShop languageId
    if (platform === 'prestashop') {
      const languageIso = (options as Record<string, unknown>)?.language as string;

      if (languageIso && !finalOptions.languageId) {
        // Check cache first
        const cacheKey = `${platformConfig?.apiUrl || process.env.PRESTASHOP_URL}:${languageIso}`;

        if (languageIdCache.has(cacheKey)) {
          finalOptions.languageId = languageIdCache.get(cacheKey);
        } else {
          // Fetch languages from PrestaShop to find the ID
          try {
            const client = new PrestaShopApiClient({
              apiUrl: platformConfig?.apiUrl || process.env.PRESTASHOP_URL!,
              apiKey: platformConfig?.apiKey || process.env.PRESTASHOP_API_KEY!,
              languageId: 1,
            });

            const languages = await client.getLanguages();
            const matchedLang = languages.find(
              l => l.iso_code.toLowerCase() === languageIso.toLowerCase()
            );

            if (matchedLang) {
              const langId = String(matchedLang.id);
              languageIdCache.set(cacheKey, langId);
              finalOptions.languageId = langId;
            }
          } catch (langError) {
            console.warn('Failed to fetch languages for mapping:', langError);
            // Continue with default languageId
          }
        }
      }
    }

    // Publish product
    const product = draft.product as unknown as UnifiedProduct;
    const publishResult = await adapter.publishProduct(product, finalOptions);

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
