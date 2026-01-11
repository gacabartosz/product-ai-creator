// Base Platform Adapter
// Abstract class that all platform adapters must extend

import type {
  Platform,
  PlatformAdapter,
  PlatformConfig,
  PlatformContext,
  PublishOptions,
  PublishResult,
} from '@/types/adapters';
import type { UnifiedProduct } from '@/types/unified-product';

export abstract class BasePlatformAdapter implements PlatformAdapter {
  abstract readonly platform: Platform;
  abstract readonly displayName: string;

  protected config: PlatformConfig;

  constructor(config: PlatformConfig) {
    this.config = config;
  }

  abstract testConnection(): Promise<{ success: boolean; error?: string }>;

  abstract getContext(): Promise<PlatformContext>;

  abstract transformProduct(
    product: UnifiedProduct,
    options?: PublishOptions
  ): Promise<unknown>;

  abstract publishProduct(
    product: UnifiedProduct,
    options?: PublishOptions
  ): Promise<PublishResult>;

  abstract updateProduct(
    externalId: string,
    product: UnifiedProduct,
    options?: PublishOptions
  ): Promise<PublishResult>;

  abstract deleteProduct(
    externalId: string
  ): Promise<{ success: boolean; error?: string }>;

  abstract getProduct(externalId: string): Promise<unknown>;

  abstract uploadImage(
    productId: string,
    imageUrl: string,
    position?: number
  ): Promise<{ success: boolean; imageId?: string; error?: string }>;

  // Helper to fetch with timeout
  protected async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeoutMs: number = 30000
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeout);
    }
  }

  // Helper to build Basic Auth header
  protected getBasicAuthHeader(apiKey: string): string {
    return `Basic ${Buffer.from(apiKey + ':').toString('base64')}`;
  }
}
